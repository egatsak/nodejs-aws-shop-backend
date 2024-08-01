import { Controller, Delete, Get, Post } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('product')
  getProduct() {}

  @Post('product')
  createProduct() {}

  @Delete('product')
  deleteProduct() {}
}
