import { Injectable, ConflictException } from '@nestjs/common';
import { ArtistStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArtistDto } from './dto/create-artist.dto';

@Injectable()
export class ArtistsService {
  constructor(private prisma: PrismaService) {}

  async apply(userId: string, dto: CreateArtistDto) {
    const existing = await this.prisma.artist.findFirst({
      where: {
        userId,
        status: { in: [ArtistStatus.PENDING, ArtistStatus.APPROVED] },
      },
    });
    if (existing) {
      throw new ConflictException('An active or pending artist application already exists');
    }

    return this.prisma.artist.create({
      data: { ...dto, userId },
    });
  }
}