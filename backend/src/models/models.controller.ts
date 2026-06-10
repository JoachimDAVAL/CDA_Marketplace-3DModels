import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ModelsService } from './models.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { UpdateModelStatusDto } from './dto/update-model-status.dto';
import { GetModelsDto } from './dto/get-models.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('models')
export class ModelsController {
  constructor(private modelsService: ModelsService) {}

  @Get()
  findAll(@Query() dto: GetModelsDto) {
    return this.modelsService.findAll(dto);
  }

  // Route search avant :id pour éviter que NestJS interprète "search" comme un UUID.
  @Get('search')
  search(@Query('q') q: string) {
    return this.modelsService.search(q ?? '');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modelsService.findOne(id);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ARTIST')
  @Post()
  // FileFieldsInterceptor parse le multipart/form-data et expose les fichiers
  // dans req.files. On attend deux champs : "renders" (1 à 10 images) et "source" (1 GLB).
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'renders', maxCount: 10 },
      { name: 'source', maxCount: 1 },
    ]),
  )
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateModelDto,
    @UploadedFiles() files: { renders?: Express.Multer.File[]; source?: Express.Multer.File[] },
  ) {
    return this.modelsService.create(user.id, dto, {
      renders: files.renders ?? [],
      // source est un tableau côté multer mais on n'attend qu'un seul fichier.
      // La validation de présence est faite dans le service.
      source: files.source?.[0] as Express.Multer.File,
    });
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ARTIST')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateModelDto,
  ) {
    return this.modelsService.update(id, user.id, dto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateModelStatusDto) {
    return this.modelsService.updateStatus(id, dto);
  }
}