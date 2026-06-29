import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GalleryService } from './gallery.service';
import { CreateGalleryImageDto, UpdateGalleryImageDto } from './dto/create-gallery-image.dto';
import { ClerkGuard } from '../auth/guards/clerk.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  findAll(@Query('unitId') unitId?: string) {
    return this.galleryService.findAll(unitId);
  }

  @UseGuards(ClerkGuard, AdminGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateGalleryImageDto,
  ) {
    return this.galleryService.upload(file, dto);
  }

  @UseGuards(ClerkGuard, AdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGalleryImageDto) {
    return this.galleryService.update(id, dto);
  }

  @UseGuards(ClerkGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.galleryService.remove(id);
  }
}
