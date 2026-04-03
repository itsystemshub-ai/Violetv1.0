import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Logger } from './common/utils/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || 'http://localhost:5173',
    credentials: configService.get('CORS_CREDENTIALS') || true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
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

  const port = configService.get('PORT') || 3000;
  const host = configService.get('HOST') || '0.0.0.0';

  await app.listen(port, host);

  Logger.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀  E R P   Z E N I T H   -   B A C K E N D             ║
║                                                           ║
║   Environment: ${configService.get('NODE_ENV')?.padEnd(40)}║
║   Port: ${String(port)?.padEnd(48)}║
║   Host: ${String(host)?.padEnd(46)}║
║   Database: PostgreSQL                                    ║
║                                                           ║
║   API: http://${host}:${port}/api                                     ║
║   Health: http://${host}:${port}/health                               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  Logger.log('✅ Server ready!');
}

bootstrap();
