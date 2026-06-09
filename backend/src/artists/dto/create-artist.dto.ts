import { IsString, IsOptional, IsUrl, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateArtistDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstname: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastname: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @Matches(/^\d{14}$/, { message: 'SIRET must be 14 digits' })
  siret?: string;

  @IsOptional()
  @IsUrl()
  portfolioUrl?: string;
}