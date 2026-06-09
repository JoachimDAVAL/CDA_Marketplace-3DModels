import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DownloadsService } from './downloads.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

// uuid (dependance transitive de StorageService) est un module ESM que Jest
// ne peut pas parser sans configuration supplementaire. On mock le module entier
// pour eviter de charger les vraies dependances — seul le token DI nous interesse.
jest.mock('../storage/storage.service', () => ({
  StorageService: class StorageService {},
}));

describe('DownloadsService', () => {
  let service: DownloadsService;
  let prisma: {
    file: { findUnique: jest.Mock };
    orderItem: { findFirst: jest.Mock };
    download: { count: jest.Mock; create: jest.Mock };
  };
  let storage: { getSignedUrl: jest.Mock };

  const userId = 'user-uuid';
  const fileId = 'file-uuid';
  const file = {
    id: fileId,
    filename: 'model.glb',
    url: 'r2://bucket/model.glb',
    modelId: 'model-uuid',
    model: { id: 'model-uuid', title: 'My Model' },
  };
  const orderItem = {
    modelId: 'model-uuid',
    order: { id: 'order-uuid', userId, status: 'PAID' },
  };

  beforeEach(async () => {
    prisma = {
      file: { findUnique: jest.fn() },
      orderItem: { findFirst: jest.fn() },
      download: { count: jest.fn(), create: jest.fn() },
    };
    storage = { getSignedUrl: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DownloadsService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get<DownloadsService>(DownloadsService);
  });

  it('leve NotFoundException si le fichier est introuvable', async () => {
    prisma.file.findUnique.mockResolvedValue(null);

    await expect(service.getSignedDownloadUrl(userId, fileId)).rejects.toThrow(NotFoundException);
    expect(prisma.orderItem.findFirst).not.toHaveBeenCalled();
  });

  it('leve ForbiddenException si aucun achat PAID pour ce fichier', async () => {
    prisma.file.findUnique.mockResolvedValue(file);
    prisma.orderItem.findFirst.mockResolvedValue(null);

    await expect(service.getSignedDownloadUrl(userId, fileId)).rejects.toThrow(ForbiddenException);
    expect(prisma.download.count).not.toHaveBeenCalled();
  });

  it('leve ForbiddenException si la limite de 5 telechargements est atteinte', async () => {
    prisma.file.findUnique.mockResolvedValue(file);
    prisma.orderItem.findFirst.mockResolvedValue(orderItem);
    prisma.download.count.mockResolvedValue(5);

    await expect(service.getSignedDownloadUrl(userId, fileId)).rejects.toThrow(ForbiddenException);
    expect(prisma.download.create).not.toHaveBeenCalled();
    expect(storage.getSignedUrl).not.toHaveBeenCalled();
  });

  it('enregistre le Download AVANT de generer l URL signee', async () => {
    prisma.file.findUnique.mockResolvedValue(file);
    prisma.orderItem.findFirst.mockResolvedValue(orderItem);
    prisma.download.count.mockResolvedValue(0);

    let downloadCreatedFirst = false;
    prisma.download.create.mockImplementation(async () => {
      downloadCreatedFirst = true;
    });
    storage.getSignedUrl.mockImplementation(async () => {
      // Si false ici : le Download a ete cree apres l URL — rupture de coherence d audit.
      expect(downloadCreatedFirst).toBe(true);
      return 'https://signed-url';
    });

    await service.getSignedDownloadUrl(userId, fileId);
  });

  describe('happy path', () => {
    beforeEach(() => {
      prisma.file.findUnique.mockResolvedValue(file);
      prisma.orderItem.findFirst.mockResolvedValue(orderItem);
      prisma.download.create.mockResolvedValue({});
      storage.getSignedUrl.mockResolvedValue('https://signed-url');
    });

    it('cree le Download avec userId, fileId et orderId', async () => {
      prisma.download.count.mockResolvedValue(0);

      await service.getSignedDownloadUrl(userId, fileId);

      expect(prisma.download.create).toHaveBeenCalledWith({
        data: { userId, fileId, orderId: orderItem.order.id },
      });
    });

    it('genere l URL signee avec expiration 60 secondes', async () => {
      prisma.download.count.mockResolvedValue(0);

      await service.getSignedDownloadUrl(userId, fileId);

      expect(storage.getSignedUrl).toHaveBeenCalledWith(file.url, 60);
    });

    it('retourne url, filename et downloadsRemaining corrects', async () => {
      prisma.download.count.mockResolvedValue(3);

      const result = await service.getSignedDownloadUrl(userId, fileId);

      expect(result).toEqual({
        url: 'https://signed-url',
        filename: file.filename,
        downloadsRemaining: 1,
      });
    });

    it('downloadsRemaining vaut 0 au 5eme telechargement (count = 4)', async () => {
      prisma.download.count.mockResolvedValue(4);

      const result = await service.getSignedDownloadUrl(userId, fileId);

      expect(result.downloadsRemaining).toBe(0);
    });
  });
});