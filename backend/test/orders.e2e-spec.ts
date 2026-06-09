import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { StorageService } from '../src/storage/storage.service';
import { CompressionService } from '../src/storage/compression.service';

const mockPaymentIntentsCreate = jest.fn();
const mockConstructEvent = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: { create: mockPaymentIntentsCreate },
    webhooks: { constructEvent: mockConstructEvent },
  }));
});

describe('Orders (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue({ upload: jest.fn(), delete: jest.fn(), getSignedUrl: jest.fn() })
      .overrideProvider(CompressionService)
      .useValue({ compressGlb: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    mockPaymentIntentsCreate.mockReset();
    mockConstructEvent.mockReset();
    mockPaymentIntentsCreate.mockResolvedValue({ client_secret: 'pi_test_secret' });

    await prisma.download.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.model3D.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  });

  async function registerUser(email = 'user@test.com', username = 'testuser') {
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, username, password: 'password123' });
    return { userId: reg.body.user.id as string, token: reg.body.access_token as string };
  }

  async function seedOnlineModel() {
    const user = await prisma.user.create({
      data: { email: 'artist@seed.com', username: 'seedartist', passwordHash: 'h', role: 'ARTIST' },
    });
    const artist = await prisma.artist.create({
      data: { userId: user.id, firstname: 'A', lastname: 'B', status: 'APPROVED' },
    });
    const category = await prisma.category.create({ data: { name: 'Cat', slug: 'cat' } });
    return prisma.model3D.create({
      data: {
        title: 'Test Model',
        description: 'A model for orders tests',
        price: 9.99,
        artistId: artist.id,
        categoryId: category.id,
        status: 'ONLINE',
      },
    });
  }

  // --- POST /api/orders -------------------------------------------------------

  describe('POST /api/orders', () => {
    it('401 - sans token', async () => {
      await request(app.getHttpServer()).post('/api/orders').expect(401);
    });

    it('400 - si le panier est vide', async () => {
      const { token } = await registerUser();
      await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('201 - cree une commande et retourne orderId + clientSecret', async () => {
      const { token } = await registerUser();
      const model = await seedOnlineModel();

      await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ modelId: model.id })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(res.body).toHaveProperty('orderId');
      expect(res.body.clientSecret).toBe('pi_test_secret');
      // 9.99 EUR → 999 centimes
      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 999, currency: 'eur' }),
      );
    });
  });

  // --- GET /api/orders --------------------------------------------------------

  describe('GET /api/orders', () => {
    it('401 - sans token', async () => {
      await request(app.getHttpServer()).get('/api/orders').expect(401);
    });

    it('200 - retourne les commandes de l utilisateur', async () => {
      const { userId, token } = await registerUser();
      await prisma.order.create({
        data: { userId, totalAmount: 9.99, status: 'PENDING' },
      });

      const res = await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
    });

    it('200 - n expose pas les commandes d un autre utilisateur', async () => {
      const { token } = await registerUser('a@test.com', 'usera');
      const { userId: otherUserId } = await registerUser('b@test.com', 'userb');
      await prisma.order.create({
        data: { userId: otherUserId, totalAmount: 5, status: 'PENDING' },
      });

      const res = await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });
  });

  // --- POST /api/orders/webhook -----------------------------------------------

  describe('POST /api/orders/webhook', () => {
    it('400 - si la signature Stripe est invalide', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await request(app.getHttpServer())
        .post('/api/orders/webhook')
        .set('stripe-signature', 'bad-sig')
        .send(Buffer.from('payload'))
        .expect(400);
    });

    it('payment_intent.succeeded - passe la commande en PAID', async () => {
      const { userId } = await registerUser();
      const order = await prisma.order.create({
        data: { userId, totalAmount: 9.99, status: 'PENDING' },
      });

      mockConstructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: { metadata: { orderId: order.id } } },
      });

      await request(app.getHttpServer())
        .post('/api/orders/webhook')
        .set('stripe-signature', 'test-sig')
        .send(Buffer.from('{}'))
        .expect(201);

      const updated = await prisma.order.findUnique({ where: { id: order.id } });
      expect(updated!.status).toBe('PAID');
    });

    it('payment_intent.payment_failed - passe la commande en FAILED', async () => {
      const { userId } = await registerUser();
      const order = await prisma.order.create({
        data: { userId, totalAmount: 9.99, status: 'PENDING' },
      });

      mockConstructEvent.mockReturnValue({
        type: 'payment_intent.payment_failed',
        data: { object: { metadata: { orderId: order.id } } },
      });

      await request(app.getHttpServer())
        .post('/api/orders/webhook')
        .set('stripe-signature', 'test-sig')
        .send(Buffer.from('{}'))
        .expect(201);

      const updated = await prisma.order.findUnique({ where: { id: order.id } });
      expect(updated!.status).toBe('FAILED');
    });
  });
});