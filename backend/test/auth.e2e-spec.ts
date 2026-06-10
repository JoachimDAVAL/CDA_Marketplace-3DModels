import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { StorageService } from '../src/storage/storage.service';
import { CompressionService } from '../src/storage/compression.service';

// Prerequis : base PostgreSQL accessible (Docker sur port 5433, variables .env chargees).
// StorageService et CompressionService sont overrides pour eviter les appels R2/gltf-transform.
describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue({ uploadFile: jest.fn(), deleteFile: jest.fn(), getSignedUrl: jest.fn() })
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
    await prisma.user.deleteMany();
  });

  // --- POST /api/auth/register ------------------------------------------------

  describe('POST /api/auth/register', () => {
    it('201 - cree un compte et retourne access_token sans passwordHash', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@example.com', username: 'testuser', password: 'password123' })
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('409 - si email deja utilise', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@example.com', username: 'user1', password: 'password123' });

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@example.com', username: 'user2', password: 'password123' })
        .expect(409);
    });

    it('409 - si username deja utilise', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'first@example.com', username: 'testuser', password: 'password123' });

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'second@example.com', username: 'testuser', password: 'password123' })
        .expect(409);
    });

    it('400 - si email manquant', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' })
        .expect(400);
    });

    it('400 - si password trop court (< 8 caracteres)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@example.com', username: 'testuser', password: 'short' })
        .expect(400);
    });
  });

  // --- POST /api/auth/login ---------------------------------------------------

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@example.com', username: 'testuser', password: 'password123' });
    });

    it('200 - retourne access_token avec des credentials valides', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('401 - si le mot de passe est incorrect', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('401 - si l email est inconnu', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' })
        .expect(401);
    });
  });

  // --- GET /api/auth/me -------------------------------------------------------

  describe('GET /api/auth/me', () => {
    it('200 - retourne le profil sans passwordHash avec un token valide', async () => {
      const reg = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@example.com', username: 'testuser', password: 'password123' });

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${reg.body.access_token}`)
        .expect(200);

      expect(res.body.email).toBe('test@example.com');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('401 - sans token', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('401 - avec un token invalide', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });
});