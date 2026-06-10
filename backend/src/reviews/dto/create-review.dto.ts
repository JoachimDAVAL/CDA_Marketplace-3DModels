import { IsUUID, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  modelId: string;

  // Renforcement côté DTO de la contrainte CHECK (rating BETWEEN 1 AND 5)
  // non supportée nativement par Prisma — la contrainte SQL est dans le MPD.
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}