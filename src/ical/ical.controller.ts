import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IcalService } from './ical.service';
import { ClerkGuard } from '../auth/guards/clerk.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@UseGuards(ClerkGuard, AdminGuard)
@Controller('ical')
export class IcalController {
  constructor(private readonly icalService: IcalService) {}

  @Post('sync')
  syncAll() {
    return this.icalService.syncAllUnits();
  }

  @Post('sync/:unitId')
  syncOne(@Param('unitId') unitId: string) {
    return this.icalService.syncUnit(unitId);
  }

  @Get('status')
  getStatus() {
    return this.icalService.getStatus();
  }
}
