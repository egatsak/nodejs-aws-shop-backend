import { Body, Controller, Get, Post, Put, Req, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { CartPaths } from 'src/common/cartPaths';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';
import { buildResponse } from 'src/common/helpers';

@Controller('profile/cart')
export class CartController {
  constructor(private readonly httpService: HttpService) {}

  @Get('')
  async getCart(@Req() req: Request, @Res() res: Response) {
    const result = await firstValueFrom(
      this.httpService
        .get(process.env.CART_API_BASE_URL + `${CartPaths.GET_CART}`, {
          ...(req.headers.authorization && {
            headers: {
              Authorization: req.headers.authorization,
            },
          }),
        })
        .pipe(
          catchError((error) => {
            if (error instanceof AxiosError) {
              buildResponse(res, error.response.status, error.response.data);
              return throwError(() => error);
            }
          }),
        ),
    );
    buildResponse(res, result.status, result.data);
  }

  @Put('')
  async putCart(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: unknown,
  ) {
    const result = await firstValueFrom(
      this.httpService
        .put(process.env.CART_API_BASE_URL + `${CartPaths.PUT_CART}`, body, {
          ...(req.headers.authorization && {
            headers: {
              Authorization: req.headers.authorization,
            },
          }),
        })
        .pipe(
          catchError((error) => {
            if (error instanceof AxiosError) {
              buildResponse(res, error.response.status, error.response.data);
              return throwError(() => error);
            }
          }),
        ),
    );
    buildResponse(res, result.status, result.data);
  }

  /* @Delete('')
  async deleteCart(@Req() req: Request, @Res() res: Response) {
    const result = await firstValueFrom(
      this.httpService
        .delete(process.env.CART_API_BASE_URL + `${CartPaths.DELETE_CART}`, {
          ...(req.headers.authorization && {
            headers: {
              Authorization: req.headers.authorization,
            },
          }),
        })
        .pipe(
          catchError((error) => {
            if (error instanceof AxiosError) {
              buildResponse(res, error.response.status, error.response.data);
              return throwError(() => error);
            }
          }),
        ),
    );
    buildResponse(res, result.status, result.data);
  } */

  @Post('checkout')
  async checkout(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: unknown,
  ) {
    const result = await firstValueFrom(
      this.httpService
        .post(process.env.CART_API_BASE_URL + `${CartPaths.CHECKOUT}`, body, {
          ...(req.headers.authorization && {
            headers: {
              Authorization: req.headers.authorization,
            },
          }),
        })
        .pipe(
          catchError((error) => {
            if (error instanceof AxiosError) {
              buildResponse(res, error.response.status, error.response.data);
              return throwError(() => error);
            }
          }),
        ),
    );
    buildResponse(res, result.status, result.data);
  }
}
