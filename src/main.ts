import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Raw body for Stripe webhook — must come before JSON body parser
  app.use(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
  );

  app.enableCors({
    origin: [
      process.env.CUSTOMER_FRONTEND_URL,
      process.env.ADMIN_FRONTEND_URL,
    ],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api`);
}

bootstrap();
