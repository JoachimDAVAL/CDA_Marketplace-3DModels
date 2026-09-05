import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

// Nombre maximum de téléchargements autorisés par achat et par fichier.
// Défini comme constante pour faciliter la modification et la lisibilité des guards.
const MAX_DOWNLOADS_PER_FILE = 5;

@Injectable()
export class DownloadsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async getRemainingDownloads(userId: string, fileId: string) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');

    const [orderItemCount, downloadCount] = await Promise.all([
      this.prisma.orderItem.count({ where: { modelId: file.modelId, order: { userId, status: 'PAID' } } }),
      this.prisma.download.count({ where: { userId, fileId } }),
    ]);
    if (!orderItemCount) throw new ForbiddenException('Purchase required');

    return { downloadsRemaining: orderItemCount * MAX_DOWNLOADS_PER_FILE - downloadCount };
  }

  async getSignedDownloadUrl(userId: string, fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: { model: true },
    });
    if (!file) throw new NotFoundException('File not found');

    // Récupère le dernier achat pour associer le Download à l'ordre le plus récent.
    const orderItem = await this.prisma.orderItem.findFirst({
      where: { modelId: file.modelId, order: { userId, status: 'PAID' } },
      include: { order: true },
      orderBy: { order: { createdAt: 'desc' } },
    });
    if (!orderItem) throw new ForbiddenException('Purchase required to download this file');

    // Transaction interactive : les counts et le write sont dans la même transaction
    // pour éviter qu'un double-clic ou deux onglets simultanés contournent la limite.
    const totalRemaining = await this.prisma.$transaction(async (tx) => {
      const [orderItemCount, downloadCount] = await Promise.all([
        tx.orderItem.count({ where: { modelId: file.modelId, order: { userId, status: 'PAID' } } }),
        tx.download.count({ where: { userId, fileId } }),
      ]);
      const remaining = orderItemCount * MAX_DOWNLOADS_PER_FILE - downloadCount;
      if (remaining <= 0) {
        throw new ForbiddenException(`Download limit reached (${MAX_DOWNLOADS_PER_FILE} per purchase)`);
      }
      await tx.download.create({
        data: { userId, fileId, orderId: orderItem.order.id },
      });
      await tx.model3D.update({
        where: { id: file.modelId! },
        data: { downloadCount: { increment: 1 } },
      });
      return remaining;
    });

    const signedUrl = await this.storage.getSignedUrl(file.url, 60);

    return {
      url: signedUrl,
      filename: file.filename,
      downloadsRemaining: totalRemaining - 1,
    };
  }
}