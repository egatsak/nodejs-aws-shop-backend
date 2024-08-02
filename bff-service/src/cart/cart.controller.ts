import { Controller, Delete, Get, Post, Put, Req, Res } from '@nestjs/common';
import { CartService } from './cart.service';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, lastValueFrom } from 'rxjs';
import { CartPaths } from 'src/common/cartPaths';
import { AxiosError, AxiosHeaders } from 'axios';
import { Request, Response } from 'express';

function stringify(obj) {
  let cache = [];
  const str = JSON.stringify(obj, function (key, value) {
    if (typeof value === 'object' && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
    }
    return value;
  });
  cache = null; // reset the cache
  return str;
}

@Controller('profile/cart')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly httpService: HttpService,
  ) {}

  @Get('')
  async getCart(@Req() req: Request, @Res() res: Response) {
    const result = await lastValueFrom(
      this.httpService
        .get(process.env.CART_API_BASE_URL + `${CartPaths.GET_CART}`, {
          headers: req.headers.authorization
            ? {
                Authorization: req.headers.authorization,
              }
            : {},
        })
        .pipe(
          catchError((error) => {
            if (error instanceof AxiosError) {
            }
            throw error;
          }),
        ),
    );
    res.status(result.status);
    return res.end(stringify(result.data));
  }
  /* 
  @Put('')
  putCart() {}

  @Delete('')
  deleteCart() {}

  @Post('')
  checkout() {} */
}
