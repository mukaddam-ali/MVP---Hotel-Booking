import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clerkUserId = request.auth?.userId;
    if (!clerkUserId) throw new UnauthorizedException();
    const user = await this.prisma.user.findUnique({
      where: { id: clerkUserId },
    });
    if (!user || user.role !== 'ADMIN') throw new ForbiddenException();
    return true;
  }
}
