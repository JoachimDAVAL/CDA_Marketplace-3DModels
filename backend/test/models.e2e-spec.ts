import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { StorageService } from '../src/storage/storage.service';
import { CompressionService } from '../src/storage/compression.service';

describe('Models (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const uploadMock = jest.fn();
  const compressMock = jest.fn();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue({ upload: uploadMock, delete: jest.fn(), getSignedUrl: jest.fn() })
      .overrideProvider(CompressionService)
      .useValue({ compressGlb: compressMock })
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
    // Category -> Model3D est Restrict : supprimer les models avant les categories.
    await prisma.model3D.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    uploadMock.mockResolvedValue({ key: 'test-key', url: 'https://r2.test/file' });
    compressMock.mockResolvedValue(Buffer.from('compressed-glb'));
  });

  // Helper : inscrit un user via l API puis le promut artiste via Prisma.
  async function createArtistAndToken(): Promise<string> {
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'artist@test.com', username: 'artist', password: 'password123' });

    await prisma.user.update({ where: { id: reg.body.user.id }, data: { role: 'ARTIST' } });
    await prisma.artist.create({
      data: { userId: reg.body.user.id, firstname: 'Jo', lastname: 'Doe', status: 'APPROVED' },
    });

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'artist', password: 'password123' });
    return login.body.access_token;
  }

  async function createAdminAndToken(): Promise<string> {
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'admin@test.com', username: 'admin', password: 'password123' });

    await prisma.user.update({ where: { id: reg.body.user.id }, data: { role: 'ADMIN' } });

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'password123' });
    return login.body.access_token;
  }

  // Helper : cree un model ONLINE directement en BDD.
  async function seedModel(status = 'ONLINE') {
    const user = await prisma.user.create({
      data: { email: 'seed@test.com', username: 'seed', passwordHash: 'h', role: 'ARTIST' },
    });
    const artist = await prisma.artist.create({
      data: { userId: user.id, firstname: 'S', lastname: 'D', status: 'APPROVED' },
    });
    const category = await prisma.category.create({ data: { name: 'Cat', slug: 'cat' } });
    const model = await prisma.model3D.create({
      data: {
        title: 'Seed Model',
        description: 'A seeded model',
        price: 9.99,
        artistId: artist.id,
        categoryId: category.id,
        status: status as any,
      },
    });
    return { user, artist, category, model };
  }

  // --- GET /api/models --------------------------------------------------------

  describe('GET /api/models', () => {
    it('200 - retourne uniquement les modeles ONLINE avec meta de pagination', async () => {
      const { artist, category } = await seedModel('ONLINE');
      await prisma.model3D.create({
        data: {
          title: 'Pending',
          description: 'Not visible',
          price: 5,
          artistId: artist.id,
          categoryId: category.id,
          status: 'PENDING',
        },
      });

      const res = await request(app.getHttpServer()).get('/api/models').expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Seed Model');
      expect(res.body.meta).toMatchObject({ total: 1, page: 1 });
    });

    it('200 - retourne une liste vide quand aucun modele ONLINE', async () => {
      const res = await request(app.getHttpServer()).get('/api/models').expect(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  // --- GET /api/models/search -------------------------------------------------

  describe('GET /api/models/search', () => {
    it('200 - retourne les modeles correspondant a la recherche (insensible a la casse)', async () => {
      const { artist, category } = await seedModel('ONLINE');
      await prisma.model3D.create({
        data: {
          title: 'Dragon Warrior',
          description: 'Epic dragon',
          price: 15,
          artistId: artist.id,
          categoryId: category.id,
          status: 'ONLINE',
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/models/search?q=dragon')
        .expect(200);

      const titles = res.body.map((m: any) => m.title);
      expect(titles).toContain('Dragon Warrior');
      expect(titles).not.toContain('Seed Model');
    });

    it('200 - retourne une liste vide si aucun resultat', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/models/search?q=zzznomatch')
        .expect(200);
      expect(res.body).toHaveLength(0);
    });
  });

  // --- GET /api/models/:id ----------------------------------------------------

  describe('GET /api/models/:id', () => {
    it('200 - retourne le detail du modele sans SOURCE_3D', async () => {
      const { model } = await seedModel();
      const res = await request(app.getHttpServer())
        .get(`/api/models/${model.id}`)
        .expect(200);

      expect(res.body.id).toBe(model.id);
      expect(res.body.title).toBe('Seed Model');
      const fileTypes = res.body.files?.map((f: any) => f.fileType) ?? [];
      expect(fileTypes).not.toContain('SOURCE_3D');
    });

    it('404 - si le modele est introuvable', async () => {
      await request(app.getHttpServer())
        .get('/api/models/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  // --- POST /api/models -------------------------------------------------------

  describe('POST /api/models', () => {
    it('401 - sans token', async () => {
      await request(app.getHttpServer()).post('/api/models').expect(401);
    });

    it('403 - avec un role USER (pas ARTIST)', async () => {
      const reg = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'user@test.com', username: 'user', password: 'password123' });

      await request(app.getHttpServer())
        .post('/api/models')
        .set('Authorization', `Bearer ${reg.body.access_token}`)
        .expect(403);
    });

    it('201 - cree un modele avec un artiste approuve', async () => {
      const token = await createArtistAndToken();
      const category = await prisma.category.create({ data: { name: 'Cat', slug: 'cat' } });

      const res = await request(app.getHttpServer())
        .post('/api/models')
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'My 3D Model')
        .field('description', 'A detailed description of the model')
        .field('price', '19.99')
        .field('categoryId', category.id)
        .attach('renders', Buffer.from('fake-img'), 'render.jpg')
        .attach('source', Buffer.from('fake-glb'), 'model.glb')
        .expect(201);

      expect(res.body.title).toBe('My 3D Model');
      expect(uploadMock).toHaveBeenCalledTimes(3); // render + source + preview
      expect(compressMock).toHaveBeenCalledTimes(1);
    });
  });

  // --- PATCH /api/models/:id/status -------------------------------------------

  describe('PATCH /api/models/:id/status', () => {
    it('401 - sans token', async () => {
      await request(app.getHttpServer())
        .patch('/api/models/00000000-0000-0000-0000-000000000000/status')
        .send({ status: 'ONLINE' })
        .expect(401);
    });

    it('403 - avec un role non-ADMIN', async () => {
      const { model } = await seedModel();
      const token = await createArtistAndToken();

      await request(app.getHttpServer())
        .patch(`/api/models/${model.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'ONLINE' })
        .expect(403);
    });

    it('200 - un admin peut mettre un modele ONLINE', async () => {
      const { model } = await seedModel('PENDING');
      const token = await createAdminAndToken();

      const res = await request(app.getHttpServer())
        .patch(`/api/models/${model.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'ONLINE' })
        .expect(200);

      expect(res.body.status).toBe('ONLINE');
    });
  });
});