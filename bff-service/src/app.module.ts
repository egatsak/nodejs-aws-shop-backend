import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CartModule } from './cart/cart.module';
import { ProductsModule } from './products/products.module';
import { UrlValidationMiddleware } from './middlewares/validation.middleware';

@Module({
  providers: [AppService],
  imports: [CartModule, ProductsModule],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UrlValidationMiddleware).forRoutes('*');
  }
}
