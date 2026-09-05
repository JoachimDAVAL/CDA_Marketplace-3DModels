import { Controller, Get, Delete, Param, Query, UseGuards, HttpCode, HttpStatus, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  findAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.findAllUsers(page, limit, search);
  }

  @Get('models')
  findAllModels(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.findAllModels(page, limit, status);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('reviews')
  findAllReviews(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.findAllReviews(page, limit);
  }

  @Delete('reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteReview(@Param('id') id: string) {
    return this.adminService.deleteReview(id);
  }
}