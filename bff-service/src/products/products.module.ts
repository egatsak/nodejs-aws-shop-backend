import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ProductsController } from './products.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    CacheModule.register({
      ttl: Number(process.env.CACHE_EXPIRE_TIME_PERIOD) ?? 120000,
    }),
  ],
  controllers: [ProductsController],
})
export class ProductsModule {}
