import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ical from 'node-ical';
import { eachDayOfInterval, subDays } from 'date-fns';

@Injectable()
export class IcalService {
  constructor(private readonly prisma: PrismaService) {}

  async syncAllUnits() {
    const units = await this.prisma.unit.findMany({
      where: { icalUrl: { not: null } },
    });
    const errors: { unitId: string; error: string }[] = [];

    for (const unit of units) {
      try {
        await this.syncUnit(unit.id);
      } catch (err) {
        errors.push({ unitId: unit.id, error: err.message });
      }
    }

    return { synced: units.length, errors };
  }

  async syncUnit(unitId: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundException('Unit not found');
    if (!unit.icalUrl) throw new NotFoundException('No iCal URL configured for this unit');

    const response = await fetch(unit.icalUrl);
    const rawText = await response.text();
    const parsed = ical.parseICS(rawText);

    let datesBlocked = 0;

    for (const event of Object.values(parsed)) {
      if ((event as any).type !== 'VEVENT') continue;

      const start = new Date((event as any).start);
      const rawEnd = new Date((event as any).end ?? (event as any).start);
      const end = subDays(rawEnd, 1);

      if (end < start) continue;

      const dates = eachDayOfInterval({ start, end });
      for (const date of dates) {
        await this.prisma.blockedDate.upsert({
          where: { unitId_date: { unitId, date } },
          create: { unitId, date, source: 'ICAL' },
          update: {},
        });
        datesBlocked++;
      }
    }

    await this.prisma.unit.update({
      where: { id: unitId },
      data: { icalLastSync: new Date() },
    });

    return { unitId, datesBlocked, syncedAt: new Date().toISOString() };
  }

  async getStatus() {
    const units = await this.prisma.unit.findMany({
      select: {
        id: true,
        name: true,
        icalUrl: true,
        icalLastSync: true,
        blockedDates: {
          where: { source: 'ICAL' },
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return units.map((u) => ({
      unitId: u.id,
      unitName: u.name,
      icalUrl: u.icalUrl,
      icalLastSync: u.icalLastSync?.toISOString() ?? null,
      icalBlockedCount: u.blockedDates.length,
    }));
  }
}
