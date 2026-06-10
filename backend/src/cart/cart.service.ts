import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ModelStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    // getOrCreate : le panier est créé automatiquement à la première consultation.
    // Un user n'a jamais besoin d'appeler une route "créer mon panier" explicitement.
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: {
            model: { include: { files: { where: { fileType: 'RENDER_IMAGE' } } } },
          },
        },
      },
    });
    return cart;
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const model = await this.prisma.model3D.findUnique({ where: { id: dto.modelId } });
    if (!model) throw new NotFoundException('Model not found');

    // Un modèle non ONLINE ne peut pas être acheté — évite d'ajouter au panier
    // un modèle retiré ou en attente de modération entre deux sessions.
    if (model.status !== ModelStatus.ONLINE) {
      throw new ConflictException('Model is not available for purchase');
    }

    // Vérification que le user ne possède pas déjà ce modèle (Order PAID).
    // Evite d'acheter deux fois le même modèle.
    const alreadyOwned = await this.prisma.orderItem.findFirst({
      where: {
        modelId: dto.modelId,
        order: { userId, status: 'PAID' },
      },
    });
    if (alreadyOwned) throw new ConflictException('You already own this model');

    // upsert sur le Cart : créé s'il n'existe pas encore pour ce user.
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    // La contrainte UNIQUE(cartId, modelId) en BDD protège aussi contre les doublons,
    // mais on lève une erreur explicite avant pour un meilleur message côté client.
    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_modelId: { cartId: cart.id, modelId: dto.modelId } },
    });
    if (existingItem) throw new ConflictException('Model already in cart');

    return this.prisma.cartItem.create({
      data: { cartId: cart.id, modelId: dto.modelId },
      include: { model: true },
    });
  }

  async removeItem(userId: string, modelId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = await this.prisma.cartItem.findUnique({
      where: { cartId_modelId: { cartId: cart.id, modelId } },
    });
    if (!item) throw new NotFoundException('Item not found in cart');

    return this.prisma.cartItem.delete({
      where: { cartId_modelId: { cartId: cart.id, modelId } },
    });
  }
}