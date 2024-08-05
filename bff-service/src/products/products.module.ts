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
      ttl: 120000,
    }),
  ],
  controllers: [ProductsController],
})
export class ProductsModule {}
