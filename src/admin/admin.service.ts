import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import {
  addDays,
  endOfMonth,
  startOfMonth,
  startOfToday,
  endOfToday,
  addDays as add,
} from 'date-fns';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async getStats() {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const next7 = addDays(now, 7);

    const [
      totalRevenue,
      revenueThisMonth,
      totalBookings,
      bookingsThisMonth,
      upcomingCheckins,
      upcomingCheckouts,
      totalGuests,
      totalUnits,
      units,
    ] = await Promise.all([
      this.prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.payment.aggregate({ where: { status: 'PAID', createdAt: { gte: monthStart, lte: monthEnd } }, _sum: { amount: true } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
      this.prisma.booking.count({ where: { status: 'CONFIRMED', checkin: { gte: now, lte: next7 } } }),
      this.prisma.booking.count({ where: { status: 'CONFIRMED', checkout: { gte: now, lte: next7 } } }),
      this.prisma.booking.aggregate({ where: { status: { in: ['CONFIRMED', 'COMPLETED'] } }, _sum: { guests: true } }),
      this.prisma.unit.count(),
      this.prisma.unit.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          bookings: {
            where: { status: 'CONFIRMED', checkin: { gte: now } },
            orderBy: { checkin: 'asc' },
            take: 1,
            select: { checkin: true, checkout: true },
          },
          _count: { select: { bookings: true } },
        },
      }),
    ]);

    const bookedUnitNights = await this.prisma.blockedDate.count({
      where: { source: 'BOOKING', date: { gte: monthStart, lte: monthEnd } },
    });
    const totalUnitNights = totalUnits * 30;
    const occupancyRate = totalUnitNights > 0 ? Math.round((bookedUnitNights / totalUnitNights) * 100) : 0;

    return {
      totalRevenue: Number(totalRevenue._sum.amount ?? 0),
      revenueThisMonth: Number(revenueThisMonth._sum.amount ?? 0),
      totalBookings,
      bookingsThisMonth,
      occupancyRate,
      upcomingCheckins,
      upcomingCheckouts,
      totalGuests: totalGuests._sum.guests ?? 0,
      totalUnits,
      unitsSummary: units.map((u) => ({
        unitId: u.id,
        unitName: u.name,
        status: u.status,
        nextCheckin: u.bookings[0]?.checkin?.toISOString() ?? null,
        nextCheckout: u.bookings[0]?.checkout?.toISOString() ?? null,
        totalBookings: u._count.bookings,
      })),
    };
  }

  async getUsers(query: { search?: string; role?: string; page?: string; limit?: string }) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);
    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.role) where.role = query.role;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { _count: { select: { bookings: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        bookingCount: u._count.bookings,
        createdAt: u.createdAt,
      })),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        bookings: {
          include: { unit: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      bookings: user.bookings.map((b) => ({
        id: b.id,
        unitName: b.unit.name,
        checkin: b.checkin,
        checkout: b.checkout,
        status: b.status,
        totalPrice: Number(b.totalPrice),
      })),
    };
  }

  async updateUserRole(id: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const updated = await this.prisma.user.update({ where: { id }, data: { role: role as any } });
    return { id: updated.id, role: updated.role };
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const active = await this.prisma.booking.count({
      where: { userId: id, status: { in: ['PENDING', 'CONFIRMED'] } },
    });
    if (active > 0) throw new ConflictException('Cannot delete a user with active bookings');
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted' };
  }

  async getCalendar(unitId: string) {
    return this.prisma.blockedDate.findMany({
      where: { unitId },
      orderBy: { date: 'asc' },
    });
  }

  async blockDates(body: { unitId: string; dates: string[]; note?: string }) {
    const unit = await this.prisma.unit.findUnique({ where: { id: body.unitId } });
    if (!unit) throw new NotFoundException('Unit not found');

    await this.prisma.blockedDate.createMany({
      data: body.dates.map((d) => ({
        unitId: body.unitId,
        date: new Date(d),
        source: 'MANUAL',
        note: body.note ?? null,
      })),
      skipDuplicates: true,
    });

    return { blocked: body.dates.length };
  }

  async unblockDate(id: string) {
    const row = await this.prisma.blockedDate.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Blocked date not found');
    if (row.source !== 'MANUAL')
      throw new ForbiddenException('Only MANUAL-sourced blocked dates can be unblocked via this endpoint');
    await this.prisma.blockedDate.delete({ where: { id } });
    return { message: 'Date unblocked' };
  }

  async getPayments(query: { status?: string; from?: string; to?: string; page?: string; limit?: string }) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          booking: {
            include: {
              unit: { select: { name: true } },
              user: { select: { name: true } },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments.map((p) => ({
        id: p.id,
        bookingId: p.bookingId,
        unitName: p.booking.unit.name,
        guestName: p.booking.user.name,
        amount: Number(p.amount),
        status: p.status,
        stripePaymentIntent: p.stripePaymentIntent,
        createdAt: p.createdAt,
      })),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async refundPayment(paymentId: string) {
    return this.paymentsService.refund(paymentId);
  }

  async getCheckinsToday() {
    const start = startOfToday();
    const end = endOfToday();
    return this.prisma.booking.findMany({
      where: { status: 'CONFIRMED', checkin: { gte: start, lte: end } },
      include: {
        unit: { select: { name: true } },
        user: { select: { name: true } },
      },
    }).then((list) =>
      list.map((b) => ({
        bookingId: b.id,
        unitName: b.unit.name,
        guestName: b.user.name,
        guests: b.guests,
        checkin: b.checkin,
      })),
    );
  }

  async getCheckoutsToday() {
    const start = startOfToday();
    const end = endOfToday();
    return this.prisma.booking.findMany({
      where: { status: 'CONFIRMED', checkout: { gte: start, lte: end } },
      include: {
        unit: { select: { name: true } },
        user: { select: { name: true } },
      },
    }).then((list) =>
      list.map((b) => ({
        bookingId: b.id,
        unitName: b.unit.name,
        guestName: b.user.name,
        guests: b.guests,
        checkout: b.checkout,
      })),
    );
  }

  async getUpcomingCheckins() {
    const now = new Date();
    const next7 = addDays(now, 7);
    return this.prisma.booking.findMany({
      where: { status: 'CONFIRMED', checkin: { gte: now, lte: next7 } },
      include: {
        unit: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { checkin: 'asc' },
    }).then((list) =>
      list.map((b) => ({
        bookingId: b.id,
        unitName: b.unit.name,
        guestName: b.user.name,
        guests: b.guests,
        checkin: b.checkin,
        daysUntil: Math.ceil((b.checkin.getTime() - now.getTime()) / 86400000),
      })),
    );
  }
}
