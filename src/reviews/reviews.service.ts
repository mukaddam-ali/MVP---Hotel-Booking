import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const reviews = await this.prisma.review.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        unit: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reviews.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user.name,
      rating: r.rating,
      content: r.content,
      featured: r.featured,
      createdAt: r.createdAt,
      unit: { name: r.unit.name },
      user: { email: r.user.email },
    }));
  }

  async findByUnit(unitId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { unitId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reviews.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user.name,
      rating: r.rating,
      content: r.content,
      featured: r.featured,
      createdAt: r.createdAt,
    }));
  }

  async create(userId: string, dto: CreateReviewDto) {
    const eligible = await this.prisma.booking.findFirst({
      where: {
        id: dto.bookingId,
        userId,
        unitId: dto.unitId,
        status: 'COMPLETED',
        reviewed: false,
      },
    });
    if (!eligible) throw new ForbiddenException('No eligible booking to review');

    const existing = await this.prisma.review.findUnique({
      where: { bookingId: dto.bookingId },
    });
    if (existing) throw new ConflictException('Booking already reviewed');

    const review = await this.prisma.$transaction(async (tx) => {
      const r = await tx.review.create({
        data: {
          userId,
          unitId: dto.unitId,
          bookingId: dto.bookingId,
          rating: dto.rating,
          content: dto.content,
        },
      });
      await tx.booking.update({
        where: { id: dto.bookingId },
        data: { reviewed: true },
      });
      return r;
    });

    return review;
  }

  async remove(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.prisma.review.delete({ where: { id } });
    return { message: 'Review deleted' };
  }

  async toggleFeatured(id: string, featured: boolean) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    const updated = await this.prisma.review.update({
      where: { id },
      data: { featured },
    });
    return { id: updated.id, featured: updated.featured };
  }
}
