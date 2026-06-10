import { IsOptional, IsUUID, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ModelSortBy {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
  POPULAR = 'popular',
}

export class GetModelsDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(ModelSortBy)
  sortBy?: ModelSortBy;

  // page et limit permettent la pagination côté client.
  // Valeurs par défaut définies dans le service pour éviter
  // de retourner toute la table si les params sont absents.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}