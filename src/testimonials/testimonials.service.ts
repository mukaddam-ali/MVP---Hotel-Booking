import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const [manual, featured] = await Promise.all([
      this.prisma.testimonial.findMany({ orderBy: { order: 'asc' } }),
      this.prisma.review.findMany({
        where: { featured: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const manualMapped = manual.map((t) => ({
      id: t.id,
      source: 'MANUAL' as const,
      guestName: t.guestName,
      location: t.location ?? null,
      content: t.content,
      rating: t.rating ?? null,
      imageUrl: t.imageUrl ?? null,
      order: t.order,
      createdAt: t.createdAt,
    }));

    const featuredMapped = featured.map((r) => ({
      id: r.id,
      source: 'REVIEW' as const,
      guestName: r.user.name,
      location: null,
      content: r.content,
      rating: r.rating,
      imageUrl: null,
      order: 999,
      createdAt: r.createdAt,
    }));

    return [...manualMapped, ...featuredMapped].sort((a, b) => a.order - b.order);
  }

  async create(dto: CreateTestimonialDto) {
    return this.prisma.testimonial.create({ data: dto });
  }

  async update(id: string, dto: UpdateTestimonialDto) {
    await this.getOrFail(id);
    return this.prisma.testimonial.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.getOrFail(id);
    await this.prisma.testimonial.delete({ where: { id } });
    return { message: 'Testimonial deleted' };
  }

  private async getOrFail(id: string) {
    const t = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Testimonial not found');
    return t;
  }
}
