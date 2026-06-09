import { Controller, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ArtistsService } from './artists.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistStatusDto } from './dto/update-artist-status.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('artists')
export class ArtistsController {
  constructor(private artistsService: ArtistsService) {}

  @UseGuards(JwtGuard)
  @Post()
  apply(@CurrentUser() user: { id: string }, @Body() dto: CreateArtistDto) {
    return this.artistsService.apply(user.id, dto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateArtistStatusDto) {
    return this.artistsService.updateStatus(id, dto);
  }
}