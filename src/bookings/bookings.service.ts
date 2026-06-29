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
import { differenceInDays, differenceInHours } from 'date-fns';

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
    const nights = differenceInDays(new Date(dto.checkout), new Date(dto.checkin));
    const basePrice = nights * Number(unit.pricePerNight);
    const serviceFee = Math.round(nights * Number(unit.pricePerNight) * 0.12);
    const totalPrice = basePrice + Number(unit.cleaningFee) + serviceFee;

    const booking = await this.prisma.booking.create({
      data: {
        userId,
        unitId: dto.unitId,
        checkin: new Date(dto.checkin),
        checkout: new Date(dto.checkout),
        guests: dto.guests,
        totalPrice,
      },
    });

    return { ...booking, totalPrice: Number(booking.totalPrice) };
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
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException('Access denied');
    if (booking.status === 'CANCELLED')
      throw new ConflictException('Booking is already cancelled');

    const hoursUntil = differenceInHours(booking.checkin, new Date());
    if (hoursUntil <= 48)
      throw new ConflictException('Cancellation window has passed. Contact the property for assistance.');

    await this.prisma.$transaction([
      this.prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } }),
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
    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: status as any },
    });
    return { id: updated.id, status: updated.status };
  }
}
