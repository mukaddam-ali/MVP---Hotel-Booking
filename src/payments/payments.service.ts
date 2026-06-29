import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import Stripe from 'stripe';
import { eachDayOfInterval, subDays } from 'date-fns';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }

  async createSession(userId: string, dto: CreateSessionDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { unit: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException('Access denied');
    if (booking.status !== 'PENDING')
      throw new ConflictException('Booking is not in PENDING status');

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: process.env.STRIPE_CURRENCY ?? 'usd',
            product_data: { name: booking.unit.name },
            unit_amount: Math.round(Number(booking.totalPrice) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: dto.successUrl,
      cancel_url: dto.cancelUrl,
      metadata: { bookingId: booking.id },
    });

    await this.prisma.payment.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        stripeSessionId: session.id,
        amount: booking.totalPrice,
        currency: process.env.STRIPE_CURRENCY ?? 'usd',
      },
      update: { stripeSessionId: session.id },
    });

    return { sessionId: session.id, url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      throw new BadRequestException('Webhook signature verification failed');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
    }

    return { received: true };
  }

  private async handleSessionCompleted(session: Stripe.Checkout.Session) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripeSessionId: session.id },
      include: { booking: true },
    });
    if (!payment) return;

    const booking = payment.booking;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          stripePaymentIntent: session.payment_intent as string,
        },
      });

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'CONFIRMED' },
      });

      const dates = eachDayOfInterval({
        start: booking.checkin,
        end: subDays(booking.checkout, 1),
      });

      for (const date of dates) {
        await tx.blockedDate.upsert({
          where: { unitId_date: { unitId: booking.unitId, date } },
          create: { unitId: booking.unitId, date, source: 'BOOKING', bookingId: booking.id },
          update: {},
        });
      }
    });
  }

  private async handlePaymentFailed(intent: Stripe.PaymentIntent) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntent: intent.id },
    });
    if (!payment) return;
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });
  }

  async refund(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'PAID')
      throw new ConflictException('Payment is not in PAID status');

    const refund = await this.stripe.refunds.create({
      payment_intent: payment.stripePaymentIntent,
    });

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' },
      }),
      this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CANCELLED' },
      }),
      this.prisma.blockedDate.deleteMany({
        where: { bookingId: payment.bookingId, source: 'BOOKING' },
      }),
    ]);

    return { paymentId: payment.id, refundId: refund.id, status: 'REFUNDED' };
  }
}
