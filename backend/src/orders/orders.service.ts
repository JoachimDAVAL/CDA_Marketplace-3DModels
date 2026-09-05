import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus, ModelStatus } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  // InstanceType<typeof Stripe> contourne le conflit entre le namespace Stripe
  // et l'interface de classe sous NodeNext module resolution.
  private stripe: InstanceType<typeof Stripe>;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.getOrThrow<string>('STRIPE_SECRET_KEY'));
  }

  async checkout(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { model: true } } },
    });

    if (!cart?.items.length) throw new BadRequestException('Cart is empty');

    const unavailable = cart.items.filter((item) => item.model.status !== ModelStatus.ONLINE);
    if (unavailable.length > 0) {
      throw new BadRequestException(
        `These models are no longer available: ${unavailable.map((i) => i.model.title).join(', ')}`,
      );
    }

    // Le total est calculé côté serveur à partir des prix en BDD,
    // jamais depuis le frontend — empêche toute manipulation du montant.
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + Number(item.model.price),
      0,
    );

    // Snapshot des prix au moment du checkout : si l'artiste change le prix
    // après la commande, l'OrderItem conserve le prix payé.
    const order = await this.prisma.order.create({
      data: {
        userId,
        totalAmount,
        status: PaymentStatus.PENDING,
        items: {
          create: cart.items.map((item) => ({
            modelId: item.modelId,
            priceAtPurchase: item.model.price,
          })),
        },
      },
    });

    // Commande gratuite : pas de PaymentIntent, passage direct en PAID.
    if (totalAmount === 0) {
      await this.completeOrder(order.id, userId);
      return { orderId: order.id, clientSecret: null };
    }

    // Stripe attend un montant en centimes (integer).
    // On multiplie par 100 et on arrondit pour éviter les erreurs de virgule flottante.
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'eur',
      // metadata permet de retrouver l'Order associé dans le webhook Stripe.
      metadata: { orderId: order.id },
    });

    return { orderId: order.id, clientSecret: paymentIntent.client_secret };
  }

  async findAll(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { model: { select: { id: true, title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            model: {
              select: {
                id: true,
                title: true,
                files: { select: { id: true, filename: true, fileType: true, url: true, size: true } },
              },
            },
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new NotFoundException('Order not found');
    return order;
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');

    // constructEvent vérifie la signature HMAC du webhook pour s'assurer
    // que la requête vient bien de Stripe et non d'un tiers malveillant.
    // Le type est inféré directement depuis la valeur de retour de constructEvent.
    let event: ReturnType<typeof this.stripe.webhooks.constructEvent>;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      await this.handlePaymentSuccess(event.data.object as { metadata: Record<string, string> });
    }

    if (event.type === 'payment_intent.payment_failed') {
      await this.handlePaymentFailure(event.data.object as { metadata: Record<string, string> });
    }

    return { received: true };
  }

  private async handlePaymentSuccess(paymentIntent: { metadata: Record<string, string> }) {
    const orderId = paymentIntent.metadata.orderId;
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === PaymentStatus.PAID) return;
    await this.completeOrder(orderId, order.userId!);
  }

  private async completeOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { model: { include: { files: true } } } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Transaction : passage PAID + vidage du panier en une seule opération atomique.
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: PaymentStatus.PAID },
      });

      // Vidage du panier après paiement réussi.
      // Le Cart lui-même est conservé pour les prochains achats.
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
    });
  }

  private async handlePaymentFailure(paymentIntent: { metadata: Record<string, string> }) {
    const orderId = paymentIntent.metadata.orderId;
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: PaymentStatus.FAILED },
    });
  }
}