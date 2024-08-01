import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CartModule } from './cart/cart.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [CartModule, ProductsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
