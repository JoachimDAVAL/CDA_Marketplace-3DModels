import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ArtistStatus, FileType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CompressionService } from '../storage/compression.service';
import { CreateModelDto } from './dto/create-model.dto';

@Injectable()
export class ModelsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private compression: CompressionService,
  ) {}

  async create(
    userId: string,
    dto: CreateModelDto,
    files: { renders: Express.Multer.File[]; source: Express.Multer.File },
  ) {
    // Vérification que le user est bien un artiste approuvé.
    // Le JwtGuard + RolesGuard vérifient le rôle ARTIST, mais pas le status APPROVED —
    // un artiste peut théoriquement avoir le rôle ARTIST sans Artist.status APPROVED
    // si les données sont incohérentes. Cette vérification métier le garantit.
    const artist = await this.prisma.artist.findFirst({
      where: { userId, status: ArtistStatus.APPROVED },
    });
    if (!artist) throw new ForbiddenException('Approved artist profile required');

    if (!files.renders?.length) {
      throw new BadRequestException('At least one render image is required');
    }
    if (!files.source) {
      throw new BadRequestException('A source 3D file is required');
    }

    // Upload des renders en parallèle pour optimiser le temps de traitement.
    const renderUploads = await Promise.all(
      files.renders.map((f) => this.storage.upload(f.buffer, 'renders', f.originalname)),
    );

    // Upload du SOURCE_3D (fichier original haute qualité, accès privé post-achat).
    const sourceUpload = await this.storage.upload(
      files.source.buffer,
      'sources',
      files.source.originalname,
    );

    // Génération et upload du PREVIEW_3D (GLB compressé Draco, accès public pour le viewer).
    // Effectué après l'upload du source pour ne pas bloquer en cas d'échec de compression.
    const previewBuffer = await this.compression.compressGlb(files.source.buffer);
    const previewUpload = await this.storage.upload(
      previewBuffer,
      'previews',
      files.source.originalname,
    );

    // Création du modèle et de tous ses fichiers dans une transaction.
    // Si l'écriture en BDD échoue après les uploads R2, les fichiers orphelins
    // resteront sur R2 — acceptable pour une V1, à gérer avec un job de nettoyage en V2.
    return this.prisma.model3D.create({
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        artistId: artist.id,
        categoryId: dto.categoryId,
        files: {
          create: [
            ...renderUploads.map((u, i) => ({
              url: u.url,
              filename: files.renders[i].originalname,
              fileType: FileType.RENDER_IMAGE,
              size: files.renders[i].size,
            })),
            {
              url: sourceUpload.url,
              filename: files.source.originalname,
              fileType: FileType.SOURCE_3D,
              size: files.source.size,
            },
            {
              url: previewUpload.url,
              filename: files.source.originalname,
              fileType: FileType.PREVIEW_3D,
              size: previewBuffer.length,
            },
          ],
        },
      },
      include: { files: true, artist: { include: { user: { omit: { passwordHash: true } } } } },
    });
  }
}