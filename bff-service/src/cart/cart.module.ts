import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [CartController],
})
export class CartModule {}
