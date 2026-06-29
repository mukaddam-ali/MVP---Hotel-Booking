import {
  Body,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ClerkGuard } from '../auth/guards/clerk.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(ClerkGuard)
  @Post('session')
  createSession(@Req() req: any, @Body() dto: CreateSessionDto) {
    return this.paymentsService.createSession(req.auth.userId, dto);
  }

  @Post('webhook')
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.body as unknown as Buffer, signature);
  }
}
