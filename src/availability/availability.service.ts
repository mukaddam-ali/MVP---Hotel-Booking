import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { differenceInDays } from 'date-fns';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async check(unitId: string, checkinStr: string, checkoutStr: string) {
    if (!checkinStr || !checkoutStr)
      throw new BadRequestException('checkin and checkout are required');

    const checkin = new Date(checkinStr);
    const checkout = new Date(checkoutStr);
    const nights = differenceInDays(checkout, checkin);

    if (isNaN(checkin.getTime()) || isNaN(checkout.getTime()))
      throw new BadRequestException('Invalid date format');
    if (nights <= 0)
      throw new BadRequestException('checkout must be after checkin');

    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundException('Unit not found');

    const blocked = await this.prisma.blockedDate.findMany({
      where: {
        unitId,
        date: { gte: checkin, lt: checkout },
      },
    });

    const serviceFee = Math.round(nights * Number(unit.pricePerNight) * 0.12);
    const basePrice = nights * Number(unit.pricePerNight);
    const cleaningFee = Number(unit.cleaningFee);

    return {
      available: blocked.length === 0,
      blockedDates: blocked.map((b) => b.date.toISOString().split('T')[0]),
      priceSummary: {
        nights,
        basePrice,
        cleaningFee,
        serviceFee,
        totalPrice: basePrice + cleaningFee + serviceFee,
      },
    };
  }
}
