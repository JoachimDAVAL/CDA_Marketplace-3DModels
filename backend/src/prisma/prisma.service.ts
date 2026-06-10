import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Prisma se connecte paresseusement par défaut (à la première requête).
  // On force la connexion au démarrage pour détecter immédiatement
  // une BDD inaccessible plutôt que sur la première requête HTTP.
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}