import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '@prisma/client';
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
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { model: { include: { files: true } } } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Transaction : passage PAID + création des Downloads + vidage du panier
    // en une seule opération atomique. Si l'une échoue, aucune n'est appliquée.
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: PaymentStatus.PAID },
      });

      // Création d'un Download pour chaque SOURCE_3D des modèles achetés.
      // C'est ce qui débloque l'accès au téléchargement côté DownloadsService.
      for (const item of order.items) {
        if (!item.model) continue;
        const sourceFiles = item.model.files.filter((f) => f.fileType === 'SOURCE_3D');
        for (const file of sourceFiles) {
          await tx.download.create({
            data: { userId: order.userId!, fileId: file.id, orderId: order.id },
          });
        }
      }

      // Vidage du panier après paiement réussi.
      // Le Cart lui-même est conservé pour les prochains achats.
      const cart = await tx.cart.findUnique({ where: { userId: order.userId! } });
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