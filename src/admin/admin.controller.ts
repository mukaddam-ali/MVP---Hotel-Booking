import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ClerkGuard } from '../auth/guards/clerk.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ReviewsService } from '../reviews/reviews.service';
import { IsArray, IsOptional, IsString } from 'class-validator';

class BlockDatesDto {
  @IsString()
  unitId: string;

  @IsArray()
  @IsString({ each: true })
  dates: string[];

  @IsOptional()
  @IsString()
  note?: string;
}

class UpdateRoleDto {
  @IsString()
  role: string;
}

@UseGuards(ClerkGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers(@Query() query: any) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.adminService.updateUserRole(id, dto.role);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('calendar/:unitId')
  getCalendar(@Param('unitId') unitId: string) {
    return this.adminService.getCalendar(unitId);
  }

  @Post('block')
  blockDates(@Body() dto: BlockDatesDto) {
    return this.adminService.blockDates(dto);
  }

  @Delete('block/:id')
  unblockDate(@Param('id') id: string) {
    return this.adminService.unblockDate(id);
  }

  @Get('payments')
  getPayments(@Query() query: any) {
    return this.adminService.getPayments(query);
  }

  @Post('payments/:id/refund')
  refundPayment(@Param('id') id: string) {
    return this.adminService.refundPayment(id);
  }

  @Get('checkins/today')
  getCheckinsToday() {
    return this.adminService.getCheckinsToday();
  }

  @Get('checkouts/today')
  getCheckoutsToday() {
    return this.adminService.getCheckoutsToday();
  }

  @Get('checkins/upcoming')
  getUpcomingCheckins() {
    return this.adminService.getUpcomingCheckins();
  }

  @Get('reviews')
  getAllReviews() {
    return this.reviewsService.findAll();
  }
}
