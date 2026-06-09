import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DownloadsService } from './downloads.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtGuard)
@Controller('downloads')
export class DownloadsController {
  constructor(private downloadsService: DownloadsService) {}

  @Get(':fileId')
  getSignedUrl(
    @CurrentUser() user: { id: string },
    @Param('fileId') fileId: string,
  ) {
    return this.downloadsService.getSignedDownloadUrl(user.id, fileId);
  }
}