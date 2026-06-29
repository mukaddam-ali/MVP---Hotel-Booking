import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ClerkGuard } from '../auth/guards/clerk.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { IsEnum } from 'class-validator';

class UpdateStatusDto {
  @IsEnum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
  status: string;
}

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(ClerkGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.auth.userId, dto);
  }

  @UseGuards(ClerkGuard)
  @Get('mine')
  findMine(@Req() req: any, @Query() query: any) {
    return this.bookingsService.findMine(req.auth.userId, query);
  }

  @UseGuards(ClerkGuard, AdminGuard)
  @Get()
  findAll(@Query() query: any) {
    return this.bookingsService.findAll(query);
  }

  @UseGuards(ClerkGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.findById(id, req.auth.userId, false);
  }

  @UseGuards(ClerkGuard)
  @Put(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.cancel(id, req.auth.userId);
  }

  @UseGuards(ClerkGuard, AdminGuard)
  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.bookingsService.updateStatus(id, dto.status);
  }
}
