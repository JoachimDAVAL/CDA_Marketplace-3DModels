import { IsString, IsNumber, IsUUID, MinLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateModelDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  // transform: true dans le ValidationPipe convertit la string du form-data en number.
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsUUID()
  categoryId: string;
}