import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ClerkGuard } from '../auth/guards/clerk.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class FeatureReviewDto {
  @IsBoolean()
  @Type(() => Boolean)
  featured: boolean;
}

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':unitId')
  findByUnit(@Param('unitId') unitId: string) {
    return this.reviewsService.findByUnit(unitId);
  }

  @UseGuards(ClerkGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.auth.userId, dto);
  }

  @UseGuards(ClerkGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }

  @UseGuards(ClerkGuard, AdminGuard)
  @Put(':id/feature')
  toggleFeatured(@Param('id') id: string, @Body() dto: FeatureReviewDto) {
    return this.reviewsService.toggleFeatured(id, dto.featured);
  }
}
