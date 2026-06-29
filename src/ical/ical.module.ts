import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { IcalController } from './ical.controller';
import { IcalService } from './ical.service';
import { IcalScheduler } from './ical.scheduler';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ScheduleModule.forRoot(), AuthModule],
  controllers: [IcalController],
  providers: [IcalService, IcalScheduler],
})
export class IcalModule {}
