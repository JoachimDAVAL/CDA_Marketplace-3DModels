import { IsString, MinLength, MaxLength } from 'class-validator';

export class SearchModelDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  q: string;
}
