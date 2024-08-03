import { HttpService } from '@nestjs/axios';
import { Controller, Delete, Get, Post } from '@nestjs/common';

@Controller('products')
export class ProductsController {
  constructor(private readonly httpService: HttpService) {}

  /*  @Get('product')
  getProduct() {}

  @Post('product')
  createProduct() {}

  @Delete('product')
  deleteProduct() {} */
}
