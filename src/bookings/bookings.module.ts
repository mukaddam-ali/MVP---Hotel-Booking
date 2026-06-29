import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './bookings.repository';
import { AvailabilityModule } from '../availability/availability.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AvailabilityModule, AuthModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsRepository],
  exports: [BookingsService],
})
export class BookingsModule {}
