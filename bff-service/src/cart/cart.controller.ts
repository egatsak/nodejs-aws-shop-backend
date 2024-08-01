import { Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('profile/cart')
  getCart() {}

  @Put('profile/cart')
  putCart() {}

  @Delete('profile/cart')
  deleteCart() {}

  @Post('profile/cart/checkout')
  checkout() {}
}
