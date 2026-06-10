import { IsEnum } from 'class-validator';
import { ArtistStatus } from '@prisma/client';

export class UpdateArtistStatusDto {
  @IsEnum(ArtistStatus)
  status: ArtistStatus;
}