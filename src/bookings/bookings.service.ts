import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsRepository } from './bookings.repository';
import { AvailabilityService } from '../availability/availability.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { differenceInDays, differenceInHours, addDays, startOfDay } from 'date-fns';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: BookingsRepository,
    private readonly availability: AvailabilityService,
  ) {}

  async create(userId: string, dto: CreateBookingDto) {
    const result = await this.availability.check(dto.unitId, dto.checkin, dto.checkout);
    if (!result.available)
      throw new ConflictException('Selected dates are not available');

    const unit = await this.prisma.unit.findUnique({ where: { id: dto.unitId } });
    const checkin = new Date(dto.checkin);
    const checkout = new Date(dto.checkout);
    const nights = differenceInDays(checkout, checkin);
    const basePrice = nights * Number(unit.pricePerNight);
    const serviceFee = Math.round(nights * Number(unit.pricePerNight) * 0.12);
    const totalPrice = basePrice + Number(unit.cleaningFee) + serviceFee;

    // Build one blocked-date row per night (checkin inclusive, checkout exclusive)
    const nightDates = Array.from({ length: nights }, (_, i) =>
      startOfDay(addDays(checkin, i)),
    );

    try {
      const booking = await this.prisma.$transaction(async (tx) => {
        const b = await tx.booking.create({
          data: {
            userId,
            unitId: dto.unitId,
            checkin,
            checkout,
            guests: dto.guests,
            totalPrice,
          },
        });

        // Block every night atomically — unique constraint on (unitId, date)
        // catches a concurrent booking that slipped past the availability check
        await tx.blockedDate.createMany({
          data: nightDates.map((date) => ({
            unitId: dto.unitId,
            date,
            source: 'BOOKING' as const,
            bookingId: b.id,
          })),
        });

        return b;
      });

      return { ...booking, totalPrice: Number(booking.totalPrice) };
    } catch (e: any) {
      // P2002 = unique constraint violation → race condition, dates just got taken
      if (e?.code === 'P2002') {
        throw new ConflictException('Selected dates are no longer available');
      }
      throw e;
    }
  }

  async findMine(userId: string, query: any) {
    return this.repo.findMine(userId, {
      status: query.status,
      page: parseInt(query.page ?? '1', 10),
      limit: parseInt(query.limit ?? '10', 10),
    });
  }

  async findById(id: string, userId: string, isAdmin: boolean) {
    const booking = await this.repo.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');
    if (!isAdmin && booking.user.id !== userId)
      throw new ForbiddenException('Access denied');
    return booking;
  }

  async cancel(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { unit: { select: { cancellationHours: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException('Access denied');
    if (booking.status === 'CANCELLED')
      throw new ConflictException('Booking is already cancelled');

    const hoursUntil = differenceInHours(booking.checkin, new Date());
    const cancellationHours = booking.unit?.cancellationHours ?? 24;
    if (hoursUntil < cancellationHours)
      throw new ConflictException(`Cancellation is not available within ${cancellationHours} hours of check-in. Please contact the property.`);

    await this.prisma.$transaction([
      this.prisma.booking.update({ where: { id }, data: { status: 'CANCELLED', cancelledBy: 'GUEST' } }),
      this.prisma.blockedDate.deleteMany({ where: { bookingId: id, source: 'BOOKING' } }),
    ]);

    return { id, status: 'CANCELLED' };
  }

  async findAll(query: any) {
    return this.repo.findAll({
      status: query.status,
      unitId: query.unitId,
      from: query.from,
      to: query.to,
      page: parseInt(query.page ?? '1', 10),
      limit: parseInt(query.limit ?? '20', 10),
    });
  }

  async updateStatus(id: string, status: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (status === 'CANCELLED') {
      await this.prisma.$transaction([
        this.prisma.booking.update({ where: { id }, data: { status: 'CANCELLED', cancelledBy: 'ADMIN' } }),
        this.prisma.blockedDate.deleteMany({ where: { bookingId: id, source: 'BOOKING' } }),
      ]);
      return { id, status: 'CANCELLED' };
    }
    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: status as any },
    });
    return { id: updated.id, status: updated.status };
  }
}
