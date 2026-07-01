import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UnitsRepository } from './units.repository';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Injectable()
export class UnitsService {
  constructor(
    private readonly repo: UnitsRepository,
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async findAll(query: {
    type?: string;
    guests?: string;
    checkin?: string;
    checkout?: string;
  }) {
    const filters: any = {};
    if (query.type) filters.type = query.type;
    if (query.guests) filters.guests = parseInt(query.guests, 10);
    if (query.checkin && query.checkout) {
      filters.checkin = new Date(query.checkin);
      filters.checkout = new Date(query.checkout);
    }
    return this.repo.findAll(filters);
  }

  async findBySlug(slug: string) {
    const unit = await this.repo.findBySlug(slug);
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  private resolveActivePrice(dto: CreateUnitDto | UpdateUnitDto): number | undefined {
    const map: Record<string, number | undefined> = {
      winter: dto.winterRate,
      spring: dto.springRate,
      summer: dto.summerRate,
      fall:   dto.fallRate,
    };
    if (dto.activeSeason && map[dto.activeSeason] != null) {
      return map[dto.activeSeason];
    }
    return dto.pricePerNight;
  }

  async create(dto: CreateUnitDto) {
    const slug = slugify(dto.name);
    const existing = await this.prisma.unit.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('A unit with this name slug already exists');
    const pricePerNight = this.resolveActivePrice(dto) ?? 0;
    return this.repo.create({
      ...dto,
      type: dto.type ?? 'Room',
      slug,
      pricePerNight,
      sqft: dto.sqft ?? '',
      description: dto.description,
      amenities: dto.amenities,
      images: [],
    });
  }

  async update(id: string, dto: UpdateUnitDto) {
    await this.getOrFail(id);
    const pricePerNight = this.resolveActivePrice(dto);
    return this.repo.update(id, {
      ...dto as any,
      ...(pricePerNight != null ? { pricePerNight } : {}),
    });
  }

  async remove(id: string) {
    await this.getOrFail(id);
    const active = await this.prisma.booking.count({
      where: { unitId: id, status: { in: ['PENDING', 'CONFIRMED'] } },
    });
    if (active > 0)
      throw new ConflictException('Cannot delete a unit with active bookings');
    await this.repo.delete(id);
    return { message: 'Unit deleted' };
  }

  async addImages(id: string, files: Express.Multer.File[]) {
    const unit = await this.getOrFail(id);
    const urls = await Promise.all(
      files.map((f) => this.cloudinary.uploadFile(f.buffer, 'units')),
    );
    const updated = await this.repo.update(id, {
      images: { set: [...unit.images, ...urls] },
    });
    return { images: updated.images };
  }

  async removeImage(id: string, url: string) {
    const unit = await this.getOrFail(id);
    if (!unit.images.includes(url))
      throw new ConflictException('URL not found in unit images');
    const images = unit.images.filter((i: string) => i !== url);
    const updated = await this.repo.update(id, { images: { set: images } });
    return { images: updated.images };
  }

  async updateIcalUrl(id: string, icalUrl: string) {
    await this.getOrFail(id);
    const updated = await this.repo.update(id, { icalUrl });
    return { id: updated.id, icalUrl: updated.icalUrl };
  }

  private async getOrFail(id: string) {
    const unit = await this.repo.findById(id);
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }
}
