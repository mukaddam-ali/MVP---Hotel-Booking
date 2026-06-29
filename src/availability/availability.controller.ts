import { Controller, Get, Param, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get(':unitId')
  check(
    @Param('unitId') unitId: string,
    @Query('checkin') checkin: string,
    @Query('checkout') checkout: string,
  ) {
    return this.availabilityService.check(unitId, checkin, checkout);
  }
}
