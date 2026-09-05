import { Injectable, NotFoundException } from '@nestjs/common';
import { ModelStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async findAllUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;

    // Parallel count + fetch pour ne pas faire deux aller-retours sequentiels.
    const [total, users] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        omit: { passwordHash: true },
        include: {
          // On expose le profil artiste pour que l admin voie le statut d un coup.
          artist: { select: { id: true, status: true, firstname: true, lastname: true } },
        },
      }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllModels(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as ModelStatus } : {};

    const [total, models] = await Promise.all([
      this.prisma.model3D.count({ where }),
      this.prisma.model3D.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true } },
          artist: { include: { user: { select: { username: true } } } },
          files: { where: { fileType: 'RENDER_IMAGE' }, take: 1 },
        },
      }),
    ]);

    return {
      data: models,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.delete({ where: { id } });
  }

  async findAllReviews(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [total, reviews] = await Promise.all([
      this.prisma.review.count(),
      this.prisma.review.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          model: { select: { id: true, title: true } },
        },
      }),
    ]);
    return {
      data: reviews,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async deleteReview(id: string): Promise<void> {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.prisma.review.delete({ where: { id } });
  }
}