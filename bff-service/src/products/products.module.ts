import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [ProductsController],
})
export class ProductsModule {}
