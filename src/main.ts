import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .replace(/['"]/g, '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: frontendOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const puerto = process.env.PORT ?? 3001;
  await app.listen(puerto);
  console.log(`Backend NestJS corriendo en el puerto: ${puerto}`);
  console.log('Origenes CORS configurados:', frontendOrigins);
}

bootstrap();
