import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPaymentIntentsCreate = jest.fn();
const mockConstructEvent = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: { create: mockPaymentIntentsCreate },
    webhooks: { constructEvent: mockConstructEvent },
  }));
});

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: {
    cart: { findUnique: jest.Mock };
    order: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock; findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: {
    order: { update: jest.Mock };
    cart: { findUnique: jest.Mock };
    cartItem: { deleteMany: jest.Mock };
  };

  beforeEach(async () => {
    mockPaymentIntentsCreate.mockReset();
    mockConstructEvent.mockReset();

    tx = {
      order: { update: jest.fn() },
      cart: { findUnique: jest.fn() },
      cartItem: { deleteMany: jest.fn() },
    };

    prisma = {
      cart: { findUnique: jest.fn() },
      order: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(tx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { getOrThrow: jest.fn().mockReturnValue('test-key') } },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  // --- checkout ---------------------------------------------------------------

  describe('checkout', () => {
    const userId = 'user-uuid';

    it('leve BadRequestException si le panier est inexistant', async () => {
      prisma.cart.findUnique.mockResolvedValue(null);
      await expect(service.checkout(userId)).rejects.toThrow(BadRequestException);
    });

    it('leve BadRequestException si le panier est vide', async () => {
      prisma.cart.findUnique.mockResolvedValue({ userId, items: [] });
      await expect(service.checkout(userId)).rejects.toThrow(BadRequestException);
    });

    it('calcule le total cote serveur, appelle Stripe en centimes, retourne orderId et clientSecret', async () => {
      prisma.cart.findUnique.mockResolvedValue({
        userId,
        items: [
          { modelId: 'model-1', model: { price: 10.0 } },
          { modelId: 'model-2', model: { price: 25.5 } },
        ],
      });
      prisma.order.create.mockResolvedValue({ id: 'order-uuid' });
      mockPaymentIntentsCreate.mockResolvedValue({ client_secret: 'pi_secret' });

      const result = await service.checkout(userId);

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            totalAmount: 35.5,
            status: PaymentStatus.PENDING,
          }),
        }),
      );
      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 3550,
          currency: 'eur',
          metadata: { orderId: 'order-uuid' },
        }),
      );
      expect(result).toEqual({ orderId: 'order-uuid', clientSecret: 'pi_secret' });
    });
  });

  // --- findAll ----------------------------------------------------------------

  describe('findAll', () => {
    it('retourne les commandes de l utilisateur', async () => {
      const orders = [{ id: 'order-1', userId: 'user-uuid', items: [] }];
      prisma.order.findMany.mockResolvedValue(orders);

      const result = await service.findAll('user-uuid');

      expect(result).toEqual(orders);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-uuid' } }),
      );
    });
  });

  // --- handleWebhook ----------------------------------------------------------

  describe('handleWebhook', () => {
    it('leve BadRequestException si la signature Stripe est invalide', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(service.handleWebhook(Buffer.from('payload'), 'bad-sig')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('retourne { received: true } sans erreur pour un event type inconnu', async () => {
      mockConstructEvent.mockReturnValue({ type: 'charge.updated', data: { object: {} } });

      const result = await service.handleWebhook(Buffer.from('payload'), 'sig');
      expect(result).toEqual({ received: true });
    });

    describe('payment_intent.succeeded', () => {
      const orderId = 'order-uuid';
      const userId = 'user-uuid';

      beforeEach(() => {
        mockConstructEvent.mockReturnValue({
          type: 'payment_intent.succeeded',
          data: { object: { metadata: { orderId } } },
        });
        prisma.order.findUnique.mockResolvedValue({
          id: orderId,
          userId,
          items: [
            {
              modelId: 'model-1',
              model: {
                files: [
                  { id: 'file-source', fileType: 'SOURCE_3D' },
                  { id: 'file-render', fileType: 'RENDER_IMAGE' },
                ],
              },
            },
          ],
        });
        tx.cart.findUnique.mockResolvedValue({ id: 'cart-uuid' });
      });

      it('passe la commande en PAID dans la transaction', async () => {
        await service.handleWebhook(Buffer.from('payload'), 'sig');

        expect(tx.order.update).toHaveBeenCalledWith({
          where: { id: orderId },
          data: { status: PaymentStatus.PAID },
        });
      });

      it('vide le panier apres paiement', async () => {
        await service.handleWebhook(Buffer.from('payload'), 'sig');

        expect(tx.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-uuid' } });
      });

      it('leve NotFoundException si la commande est introuvable', async () => {
        prisma.order.findUnique.mockResolvedValue(null);

        await expect(service.handleWebhook(Buffer.from('payload'), 'sig')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('payment_intent.payment_failed', () => {
      it('passe la commande en FAILED', async () => {
        const orderId = 'order-uuid';
        mockConstructEvent.mockReturnValue({
          type: 'payment_intent.payment_failed',
          data: { object: { metadata: { orderId } } },
        });

        await service.handleWebhook(Buffer.from('payload'), 'sig');

        expect(prisma.order.update).toHaveBeenCalledWith({
          where: { id: orderId },
          data: { status: PaymentStatus.FAILED },
        });
      });
    });
  });
});