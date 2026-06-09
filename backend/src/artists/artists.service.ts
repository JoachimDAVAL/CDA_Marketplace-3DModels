import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { ArtistStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistStatusDto } from './dto/update-artist-status.dto';

@Injectable()
export class ArtistsService {
  constructor(private prisma: PrismaService) {}

  async apply(userId: string, dto: CreateArtistDto) {
    // On bloque uniquement si une demande PENDING ou APPROVED existe déjà.
    // Un utilisateur REJECTED peut re-soumettre une nouvelle demande.
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

  async updateStatus(artistId: string, dto: UpdateArtistStatusDto) {
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
    });
    if (!artist) throw new NotFoundException('Artist not found');

    if (dto.status === ArtistStatus.APPROVED) {
      // $transaction garantit l'atomicité : les deux mises à jour réussissent
      // ensemble ou échouent ensemble. Sans transaction, un crash entre les deux
      // pourrait laisser un Artist APPROVED avec un User au rôle USER.
      return this.prisma.$transaction([
        this.prisma.artist.update({
          where: { id: artistId },
          data: { status: ArtistStatus.APPROVED },
        }),
        this.prisma.user.update({
          where: { id: artist.userId },
          data: { role: Role.ARTIST },
        }),
      ]);
    }

    return this.prisma.artist.update({
      where: { id: artistId },
      data: { status: dto.status },
    });
  }
}