import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

// Génère un slug URL-safe depuis un nom : "Character Art" → "character-art".
// Utilisé comme identifiant lisible dans les URLs de filtrage (/categories/character-art).
function toSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: CreateCategoryDto) {
    const slug = toSlug(dto.name);
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Category already exists');

    return this.prisma.category.create({ data: { name: dto.name, slug, description: dto.description } });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOneOrFail(id);
    const data: { name?: string; slug?: string; description?: string } = { ...dto };
    // Le slug doit rester synchronisé avec le nom pour garder des URLs cohérentes.
    if (dto.name) data.slug = toSlug(dto.name);

    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOneOrFail(id);
    // La suppression échouera si des Model3D référencent cette catégorie
    // (contrainte ON DELETE RESTRICT définie dans le schéma Prisma).
    // L'admin doit réassigner les modèles avant de pouvoir supprimer.
    return this.prisma.category.delete({ where: { id } });
  }

  private async findOneOrFail(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }
}