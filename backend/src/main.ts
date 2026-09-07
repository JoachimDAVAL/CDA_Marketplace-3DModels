import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true expose req.rawBody sur chaque requête.
  // Requis par Stripe pour vérifier la signature HMAC du webhook —
  // le body parsé en JSON ne suffit pas car la signature est calculée sur les bytes bruts.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // credentials: true est requis pour que le frontend puisse envoyer
  // les cookies/headers d'auth cross-origin (port 5173 → port 3000)
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: supprime silencieusement les champs non déclarés dans le DTO
      // forbidNonWhitelisted: rejette la requête si des champs inconnus sont présents
      // transform: convertit automatiquement les types (ex: string "1" → number 1)
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Abstract — Marketplace 3D')
    .setDescription('API REST — 58 routes : auth, users, artists, categories, models, cart, orders, downloads, reviews, admin')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/api`);
  console.log(`Swagger UI        http://localhost:${port}/api/docs`);
}

bootstrap();