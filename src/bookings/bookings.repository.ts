import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const UNIT_SUMMARY = {
  id: true,
  name: true,
  slug: true,
  images: true,
};

@Injectable()
export class BookingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(
    userId: string,
    filters: { status?: string; page: number; limit: number },
  ) {
    const where: any = { userId };
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: { unit: { select: UNIT_SUMMARY } },
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data: data.map(formatBooking), total, page: filters.page, lastPage: Math.ceil(total / filters.limit) };
  }

  async findById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        unit: { select: UNIT_SUMMARY },
        user: { select: { id: true, name: true, email: true } },
        payment: { select: { status: true, stripeSessionId: true } },
      },
    });
  }

  async findAll(filters: {
    status?: string;
    unitId?: string;
    from?: string;
    to?: string;
    page: number;
    limit: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.from || filters.to) {
      where.checkin = {};
      if (filters.from) where.checkin.gte = new Date(filters.from);
      if (filters.to) where.checkin.lte = new Date(filters.to);
    }

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          unit: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data: data.map(formatBooking), total, page: filters.page, lastPage: Math.ceil(total / filters.limit) };
  }
}

function formatBooking(b: any) {
  return { ...b, totalPrice: Number(b.totalPrice) };
}
