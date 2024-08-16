import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('bff');
  app.enableCors({
    origin: (req, callback) => callback(null, true),
  });
  await app.listen(process.env.PORT);
}
bootstrap();
