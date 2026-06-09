import { IsEnum } from 'class-validator';
import { ModelStatus } from '@prisma/client';

export class UpdateModelStatusDto {
  @IsEnum(ModelStatus)
  status: ModelStatus;
}