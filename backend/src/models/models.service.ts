import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ArtistStatus, FileType, ModelStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CompressionService } from '../storage/compression.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { UpdateModelStatusDto } from './dto/update-model-status.dto';
import { GetModelsDto, ModelSortBy } from './dto/get-models.dto';

@Injectable()
export class ModelsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private compression: CompressionService,
  ) {}

  async findAll(dto: GetModelsDto, userId?: string) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.Model3DWhereInput = {
      // Le catalogue public n'expose que les modèles validés par l'admin.
      status: ModelStatus.ONLINE,
      ...(dto.categoryId && { categoryId: dto.categoryId }),
      ...(dto.minPrice !== undefined || dto.maxPrice !== undefined
        ? { price: { gte: dto.minPrice, lte: dto.maxPrice } }
        : {}),
    };

    // Mapping du paramètre de tri vers les champs Prisma orderBy.
    const orderBy: Prisma.Model3DOrderByWithRelationInput =
      dto.sortBy === ModelSortBy.PRICE_ASC ? { price: 'asc' }
      : dto.sortBy === ModelSortBy.PRICE_DESC ? { price: 'desc' }
      : dto.sortBy === ModelSortBy.POPULAR ? { downloadCount: 'desc' }
      : { createdAt: 'desc' }; // NEWEST par défaut

    // count, findMany et owned IDs en parallèle pour limiter la latence.
    const ownedQuery = userId
      ? this.prisma.orderItem.findMany({
          where: { order: { userId, status: 'PAID' }, modelId: { not: null } },
          select: { modelId: true },
        })
      : Promise.resolve([]);

    const [total, models, ownedItems] = await Promise.all([
      this.prisma.model3D.count({ where }),
      this.prisma.model3D.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          artist: { include: { user: { select: { username: true, avatar: true } } } },
          // On expose uniquement les RENDER_IMAGE dans le catalogue.
          // Le PREVIEW_3D et SOURCE_3D ne sont servis que sur la page détail.
          files: { where: { fileType: FileType.RENDER_IMAGE } },
        },
      }),
      ownedQuery,
    ]);

    // Compte les achats par modèle pour calculer les crédits disponibles.
    const orderCountByModel = new Map<string, number>();
    for (const item of ownedItems) {
      if (item.modelId) orderCountByModel.set(item.modelId, (orderCountByModel.get(item.modelId) ?? 0) + 1);
    }

    // owned = false si tous les crédits sont épuisés (re-achat autorisé dans ce cas).
    const ownedWithDownloads = new Set<string>();
    if (userId && orderCountByModel.size > 0) {
      const sourceFiles = await this.prisma.file.findMany({
        where: { modelId: { in: [...orderCountByModel.keys()] }, fileType: FileType.SOURCE_3D },
        select: { modelId: true, _count: { select: { downloads: { where: { userId } } } } },
      });
      for (const f of sourceFiles) {
        if (!f.modelId) continue;
        const purchased = orderCountByModel.get(f.modelId) ?? 0;
        if (f._count.downloads < purchased * 5) ownedWithDownloads.add(f.modelId);
      }
    }

    return {
      data: models.map(m => ({ ...m, owned: ownedWithDownloads.has(m.id) })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async search(q: string) {
    // ILIKE : recherche insensible à la casse (PostgreSQL).
    // Recherche dans le titre ET la description pour maximiser les résultats pertinents.
    return this.prisma.model3D.findMany({
      where: {
        status: ModelStatus.ONLINE,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        category: true,
        artist: { include: { user: { select: { username: true, avatar: true } } } },
        files: { where: { fileType: FileType.RENDER_IMAGE } },
      },
      take: 20,
    });
  }

  async findOne(id: string, userId?: string) {
    const model = await this.prisma.model3D.findUnique({
      where: { id },
      include: {
        category: true,
        artist: { include: { user: { omit: { passwordHash: true } } } },
        // On expose RENDER_IMAGE et PREVIEW_3D (viewer public) mais pas SOURCE_3D.
        // L'URL du SOURCE_3D n'est jamais retournée directement — elle passe
        // par le DownloadsService qui génère une URL signée après vérification de l'achat.
        files: { where: { fileType: { not: FileType.SOURCE_3D } } },
        reviews: {
          include: { user: { select: { username: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!model) throw new NotFoundException('Model not found');

    let owned = false;
    if (userId) {
      const [orderItemCount, sourceFile] = await Promise.all([
        this.prisma.orderItem.count({ where: { modelId: id, order: { userId, status: 'PAID' } } }),
        this.prisma.file.findFirst({ where: { modelId: id, fileType: FileType.SOURCE_3D } }),
      ]);
      if (orderItemCount > 0 && sourceFile) {
        const downloadCount = await this.prisma.download.count({ where: { userId, fileId: sourceFile.id } });
        owned = downloadCount < orderItemCount * 5;
      }
    }

    return { ...model, owned };
  }

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

  async update(id: string, userId: string, dto: UpdateModelDto) {
    const model = await this.findOneOrFail(id);

    // Vérification que l'artiste connecté est bien le propriétaire du modèle.
    // On compare userId (du JWT) avec artist.userId pour éviter qu'un artiste
    // puisse modifier le modèle d'un autre.
    const artist = await this.prisma.artist.findFirst({ where: { userId } });
    if (!artist || model.artistId !== artist.id) {
      throw new ForbiddenException('You do not own this model');
    }

    // Un modèle ONLINE repassé en PENDING après modification
    // pour revalidation par l'admin — garantit la cohérence du contenu modéré.
    return this.prisma.model3D.update({
      where: { id },
      data: { ...dto, status: ModelStatus.PENDING },
    });
  }

  async updateStatus(id: string, dto: UpdateModelStatusDto) {
    await this.findOneOrFail(id);
    return this.prisma.model3D.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  private async findOneOrFail(id: string) {
    const model = await this.prisma.model3D.findUnique({ where: { id } });
    if (!model) throw new NotFoundException('Model not found');
    return model;
  }
}