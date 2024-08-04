import { Body, Controller, Get, Post, Put, Req, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { buildResponse, getPathname, handleError } from 'src/common/helpers';
import { CartPaths } from 'src/common/paths';

@Controller('profile/cart')
export class CartController {
  constructor(private readonly httpService: HttpService) {}

  @Get('')
  async getCart(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(
          getPathname(process.env.CART_API_BASE_URL, CartPaths.GET_CART),
          {
            ...(req.headers.authorization && {
              headers: {
                Authorization: req.headers.authorization,
              },
            }),
          },
        ),
      );

      return buildResponse(res, result.status, result.data);
    } catch (error) {
      return handleError(error, res);
    }
  }

  @Put('')
  async putCart(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: unknown,
  ) {
    try {
      const result = await firstValueFrom(
        this.httpService.put(
          getPathname(process.env.CART_API_BASE_URL, CartPaths.PUT_CART),
          body,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(req.headers.authorization && {
                Authorization: req.headers.authorization,
              }),
            },
          },
        ),
      );

      return buildResponse(res, result.status, result.data);
    } catch (error) {
      return handleError(error, res);
    }
  }

  @Post('checkout')
  async checkout(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: unknown,
  ) {
    try {
      const result = await firstValueFrom(
        this.httpService.post(
          getPathname(process.env.CART_API_BASE_URL, CartPaths.CHECKOUT),
          body,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(req.headers.authorization && {
                Authorization: req.headers.authorization,
              }),
            },
          },
        ),
      );
      return buildResponse(res, result.status, result.data);
    } catch (error) {
      return handleError(error, res);
    }
  }
}
