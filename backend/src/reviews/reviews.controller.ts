import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @UseGuards(JwtGuard)
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.id, dto);
  }

  // Route publique : les avis sont visibles par tous les visiteurs,
  // pas seulement les acheteurs.
  @Get('model/:modelId')
  findByModel(@Param('modelId') modelId: string) {
    return this.reviewsService.findByModel(modelId);
  }
}