import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncUserDto } from './dto/sync-user.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async syncUser(dto: SyncUserDto) {
    const user = await this.prisma.user.upsert({
      where: { id: dto.clerkId },
      create: {
        id: dto.clerkId,
        name: dto.name,
        email: dto.email,
      },
      update: {
        name: dto.name,
        email: dto.email,
      },
    });
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}
