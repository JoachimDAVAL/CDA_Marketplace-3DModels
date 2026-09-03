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

    const orderItem = await this.prisma.orderItem.findFirst({
      where: { modelId: file.modelId, order: { userId, status: 'PAID' } },
    });
    if (!orderItem) throw new ForbiddenException('Purchase required');

    const downloadCount = await this.prisma.download.count({ where: { userId, fileId } });
    return { downloadsRemaining: MAX_DOWNLOADS_PER_FILE - downloadCount };
  }

  async getSignedDownloadUrl(userId: string, fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: { model: true },
    });
    if (!file) throw new NotFoundException('File not found');

    // Vérification qu'un Order PAID de ce user contient le modèle associé au fichier.
    // On cherche via OrderItem pour relier le fichier → modèle → commande payée.
    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        modelId: file.modelId,
        order: { userId, status: 'PAID' },
      },
      include: { order: true },
    });
    if (!orderItem) throw new ForbiddenException('Purchase required to download this file');

    // Comptage des téléchargements déjà effectués pour ce user + ce fichier.
    // La limite s'applique par fichier et non par commande — un user qui achète
    // deux fois le même modèle (cas modèle gratuit) ne cumule pas les téléchargements.
    const downloadCount = await this.prisma.download.count({
      where: { userId, fileId },
    });
    if (downloadCount >= MAX_DOWNLOADS_PER_FILE) {
      throw new ForbiddenException(`Download limit reached (${MAX_DOWNLOADS_PER_FILE} per file)`);
    }

    await this.prisma.$transaction([
      this.prisma.download.create({
        data: { userId, fileId, orderId: orderItem.order.id },
      }),
      this.prisma.model3D.update({
        where: { id: file.modelId },
        data: { downloadCount: { increment: 1 } },
      }),
    ]);

    // URL signée avec expiration courte (60s) : suffisant pour déclencher
    // le téléchargement, trop court pour être redistribuée.
    // L'URL permanente du fichier SOURCE_3D n'est jamais exposée directement.
    const signedUrl = await this.storage.getSignedUrl(file.url, 60);

    return {
      url: signedUrl,
      filename: file.filename,
      downloadsRemaining: MAX_DOWNLOADS_PER_FILE - downloadCount - 1,
    };
  }
}