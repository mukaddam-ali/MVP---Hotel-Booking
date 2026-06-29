import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IcalService } from './ical.service';

@Injectable()
export class IcalScheduler {
  private readonly logger = new Logger(IcalScheduler.name);

  constructor(private readonly icalService: IcalService) {}

  @Cron('0 */2 * * *')
  async syncAllUnits() {
    this.logger.log('iCal sync started');
    const result = await this.icalService.syncAllUnits();
    this.logger.log(`iCal sync done — ${result.synced} units, ${result.errors.length} errors`);
  }
}
