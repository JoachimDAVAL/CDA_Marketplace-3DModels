import { IsEnum } from 'class-validator';

export enum AdminArtistStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class UpdateArtistStatusDto {
  @IsEnum(AdminArtistStatus)
  status: AdminArtistStatus;
}