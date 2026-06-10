import { IsString, IsOptional, MinLength, MaxLength, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username?: string;

  @IsOptional()
  @IsUrl()
  avatar?: string;
}