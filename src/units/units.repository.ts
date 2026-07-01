import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UnitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: {
    type?: string;
    guests?: number;
    checkin?: Date;
    checkout?: Date;
  }) {
    const where: Prisma.UnitWhereInput = {};

    if (filters.type) where.type = filters.type;
    if (filters.guests) where.maxGuests = { gte: filters.guests };

    if (filters.checkin && filters.checkout) {
      where.blockedDates = {
        none: {
          date: { gte: filters.checkin, lt: filters.checkout },
        },
      };
    }

    const units = await this.prisma.unit.findMany({
      where,
      include: {
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return units.map((u) => this.formatUnit(u));
  }

  async findBySlug(slug: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { slug },
      include: { reviews: { select: { rating: true } } },
    });
    if (!unit) return null;
    return this.formatUnit(unit);
  }

  async findById(id: string) {
    return this.prisma.unit.findUnique({ where: { id } });
  }

  async create(data: Prisma.UnitCreateInput) {
    const unit = await this.prisma.unit.create({
      data,
      include: { reviews: { select: { rating: true } } },
    });
    return this.formatUnit(unit);
  }

  async update(id: string, data: Prisma.UnitUpdateInput) {
    const unit = await this.prisma.unit.update({
      where: { id },
      data,
      include: { reviews: { select: { rating: true } } },
    });
    return this.formatUnit(unit);
  }

  async delete(id: string) {
    return this.prisma.unit.delete({ where: { id } });
  }

  private formatUnit(unit: any) {
    const ratings = unit.reviews?.map((r: any) => r.rating) ?? [];
    const averageRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
        : null;
    const { reviews, ...rest } = unit;
    return {
      ...rest,
      pricePerNight: Number(rest.pricePerNight),
      winterRate:  rest.winterRate  != null ? Number(rest.winterRate)  : null,
      springRate:  rest.springRate  != null ? Number(rest.springRate)  : null,
      summerRate:  rest.summerRate  != null ? Number(rest.summerRate)  : null,
      fallRate:    rest.fallRate    != null ? Number(rest.fallRate)    : null,
      cleaningFee: Number(rest.cleaningFee),
      petFee:      rest.petFee     != null ? Number(rest.petFee)      : null,
      averageRating,
      reviewCount: ratings.length,
    };
  }
}
