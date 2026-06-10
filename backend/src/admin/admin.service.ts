import { Injectable, NotFoundException } from '@nestjs/common';
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

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id } });

    // Pas de corps de reponse - 204 No Content gere dans le controller.
    return;
  }
}
