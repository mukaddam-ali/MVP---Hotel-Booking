import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { ClerkGuard } from '../auth/guards/clerk.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { IsString } from 'class-validator';

class RemoveImageDto {
  @IsString()
  url: string;
}

class UpdateIcalDto {
  @IsString()
  icalUrl: string;
}

@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  findAll(@Query() query: { type?: string; guests?: string; checkin?: string; checkout?: string }) {
    return this.unitsService.findAll(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.unitsService.findBySlug(slug);
  }

  @UseGuards(ClerkGuard, AdminGuard)
  @Post()
  create(@Body() dto: CreateUnitDto) {
    return this.unitsService.create(dto);
  }

  @UseGuards(ClerkGuard, AdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitsService.update(id, dto);
  }

  @UseGuards(ClerkGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unitsService.remove(id);
  }

  @UseGuards(ClerkGuard, AdminGuard)
  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('files'))
  addImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.unitsService.addImages(id, files);
  }

  @UseGuards(ClerkGuard, AdminGuard)
  @Delete(':id/images')
  removeImage(@Param('id') id: string, @Body() body: RemoveImageDto) {
    return this.unitsService.removeImage(id, body.url);
  }

  @UseGuards(ClerkGuard, AdminGuard)
  @Put(':id/ical')
  updateIcal(@Param('id') id: string, @Body() body: UpdateIcalDto) {
    return this.unitsService.updateIcalUrl(id, body.icalUrl);
  }
}
