import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { StorageService } from '../src/storage/storage.service';
import { CompressionService } from '../src/storage/compression.service';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api - health check retourne { status: "ok" }', () => {
    return request(app.getHttpServer()).get('/api').expect(200).expect({ status: 'ok' });
  });
});