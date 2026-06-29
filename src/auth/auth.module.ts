import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClerkGuard } from './guards/clerk.guard';
import { AdminGuard } from './guards/admin.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, ClerkGuard, AdminGuard],
  exports: [ClerkGuard, AdminGuard],
})
export class AuthModule {}
