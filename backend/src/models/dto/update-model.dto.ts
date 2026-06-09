import { IsString, IsNumber, IsUUID, IsOptional, MinLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateModelDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}