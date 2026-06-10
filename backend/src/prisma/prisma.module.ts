import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() rend PrismaService injectable dans tous les modules
// sans avoir à importer PrismaModule explicitement partout.
// Justifié ici car Prisma est utilisé dans chaque module métier.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}