declare global {
  interface BigInt {
    toJSON(): string;
  }
}
BigInt.prototype.toJSON = function () {
  return this.toString();
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { INestApplication, ValidationPipe } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, transformOptions: { enableImplicitConversion: true } }));
  app.use(cookieParser())
  app.enableCors({
    origin: ['http://127.0.0.1:3000', 'http://localhost:3000'],
    credentials: true,
  })
  await app.listen(process.env.PORT ?? 8080, '0.0.0.0');
}
bootstrap();
