import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateGalleryImageDto, UpdateGalleryImageDto } from './dto/create-gallery-image.dto';

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async findAll(unitId?: string) {
    const where: any = {};
    if (unitId) where.unitId = unitId;

    const images = await this.prisma.galleryImage.findMany({
      where,
      include: { unit: { select: { id: true, name: true } } },
      orderBy: { order: 'asc' },
    });

    return images.map((img) => ({
      id: img.id,
      url: img.url,
      caption: img.caption ?? null,
      order: img.order,
      unitId: img.unitId ?? null,
      unitName: img.unit?.name ?? null,
    }));
  }

  async upload(file: Express.Multer.File, dto: CreateGalleryImageDto) {
    if (!file) throw new BadRequestException('No file provided');
    const url = await this.cloudinary.uploadFile(file.buffer, 'gallery');
    return this.prisma.galleryImage.create({
      data: {
        url,
        caption: dto.caption,
        unitId: dto.unitId ?? null,
        order: dto.order ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateGalleryImageDto) {
    await this.getOrFail(id);
    return this.prisma.galleryImage.update({
      where: { id },
      data: {
        ...(dto.caption !== undefined && { caption: dto.caption }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.unitId !== undefined && { unitId: dto.unitId }),
      },
    });
  }

  async remove(id: string) {
    const image = await this.getOrFail(id);
    await this.cloudinary.deleteFile(image.url);
    await this.prisma.galleryImage.delete({ where: { id } });
    return { message: 'Image deleted' };
  }

  private async getOrFail(id: string) {
    const image = await this.prisma.galleryImage.findUnique({ where: { id } });
    if (!image) throw new NotFoundException('Gallery image not found');
    return image;
  }
}
