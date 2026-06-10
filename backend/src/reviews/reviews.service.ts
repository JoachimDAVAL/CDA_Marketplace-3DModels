import { Injectable, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    // Guard achat : un avis nécessite un Order PAID contenant ce modèle,
    // même si le modèle est gratuit (un Order à 0€ est quand même créé).
    // Empêche les avis de non-acheteurs qui fausseraient la note moyenne.
    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        modelId: dto.modelId,
        order: { userId, status: 'PAID' },
      },
    });
    if (!orderItem) throw new ForbiddenException('Purchase required to leave a review');

    // La contrainte UNIQUE(userId, modelId) en BDD garantit un seul avis par user par modèle.
    // On lève une erreur explicite avant pour un message client plus clair qu'une erreur Prisma.
    const existing = await this.prisma.review.findUnique({
      where: { userId_modelId: { userId, modelId: dto.modelId } },
    });
    if (existing) throw new ConflictException('You have already reviewed this model');

    return this.prisma.review.create({
      data: { userId, modelId: dto.modelId, rating: dto.rating, comment: dto.comment },
      include: { user: { select: { username: true, avatar: true } } },
    });
  }

  findByModel(modelId: string) {
    return this.prisma.review.findMany({
      where: { modelId },
      include: { user: { select: { username: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}