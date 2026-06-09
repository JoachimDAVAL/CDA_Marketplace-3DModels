import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ArtistsService } from './artists.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('artists')
export class ArtistsController {
  constructor(private artistsService: ArtistsService) {}

  @UseGuards(JwtGuard)
  @Post()
  apply(@CurrentUser() user: { id: string }, @Body() dto: CreateArtistDto) {
    return this.artistsService.apply(user.id, dto);
  }
}