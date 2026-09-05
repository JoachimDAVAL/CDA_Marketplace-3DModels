import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ArtistStatus, FileType, ModelStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistStatusDto, AdminArtistStatus } from './dto/update-artist-status.dto';

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

    if (dto.status === AdminArtistStatus.APPROVED) {
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
      data: { status: dto.status as unknown as ArtistStatus },
    });
  }

  async findPublicProfile(artistId: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId, status: ArtistStatus.APPROVED },
      include: {
        user: { select: { username: true, avatar: true } },
        models: {
          where: { status: ModelStatus.ONLINE },
          include: {
            files: { where: { fileType: FileType.RENDER_IMAGE } },
            category: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!artist) throw new NotFoundException('Artist not found');

    const modelIds = artist.models.map((m) => m.id);
    const [totalSales, ratings] = await Promise.all([
      this.prisma.orderItem.count({
        where: { modelId: { in: modelIds }, order: { status: 'PAID' } },
      }),
      this.prisma.review.findMany({
        where: { modelId: { in: modelIds } },
        select: { rating: true },
      }),
    ]);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
        : 0;

    return {
      ...artist,
      stats: {
        modelCount: artist.models.length,
        totalSales,
        avgRating,
      },
    };
  }

  async findFeatured() {
    const artists = await this.prisma.artist.findMany({
      where: { status: ArtistStatus.APPROVED },
      include: {
        user: { select: { username: true, avatar: true } },
        models: {
          where: { status: ModelStatus.ONLINE },
          select: { id: true },
        },
      },
    });

    const featured = await Promise.all(
      artists.map(async (artist) => {
        const modelIds = artist.models.map((m) => m.id);
        const ratings = await this.prisma.review.findMany({
          where: { modelId: { in: modelIds } },
          select: { rating: true },
        });
        const avgRating =
          ratings.length > 0
            ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
            : 0;
        return {
          id: artist.id,
          firstname: artist.firstname,
          lastname: artist.lastname,
          user: artist.user,
          modelCount: modelIds.length,
          avgRating,
        };
      }),
    );

    return featured
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 4);
  }

  async getStats(userId: string) {
    const artist = await this.prisma.artist.findFirst({
      where: { userId, status: ArtistStatus.APPROVED },
    });
    if (!artist) throw new ForbiddenException('Approved artist profile required');

    const models = await this.prisma.model3D.findMany({
      where: { artistId: artist.id },
      select: {
        id: true,
        title: true,
        price: true,
        downloadCount: true,
        status: true,
        // Agrégation du nombre de ventes (OrderItems PAID) par modèle.
        // On compte les OrderItems dont la commande est PAID pour ne pas
        // inclure les commandes PENDING ou FAILED dans le chiffre d'affaires.
        orderItems: {
          where: { order: { status: 'PAID' } },
          select: { priceAtPurchase: true },
        },
      },
    });

    // Calcul du revenu par modèle à partir des snapshots de prix (priceAtPurchase)
    // et non du prix actuel — reflète le revenu réellement encaissé.
    const modelsWithStats = models.map((model) => ({
      id: model.id,
      title: model.title,
      status: model.status,
      currentPrice: model.price,
      downloadCount: model.downloadCount,
      salesCount: model.orderItems.length,
      revenue: model.orderItems.reduce((sum, item) => sum + Number(item.priceAtPurchase), 0),
    }));

    return {
      totalRevenue: modelsWithStats.reduce((sum, m) => sum + m.revenue, 0),
      totalSales: modelsWithStats.reduce((sum, m) => sum + m.salesCount, 0),
      totalDownloads: modelsWithStats.reduce((sum, m) => sum + m.downloadCount, 0),
      models: modelsWithStats,
    };
  }
}