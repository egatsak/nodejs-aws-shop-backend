import { HttpService } from '@nestjs/axios';
import { Controller, Delete, Get, Param, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { ProductPaths } from 'src/common/productPaths';
import { buildResponse, handleError } from 'src/common/helpers';

@Controller('products')
export class ProductsController {
  constructor(private readonly httpService: HttpService) {}

  @Get('')
  async getProducts(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(
          process.env.PRODUCT_API_BASE_URL + `${ProductPaths.GET_PRODUCT}`,
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

  @Get(':id')
  async getProduct(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(
          process.env.PRODUCT_API_BASE_URL +
            `${ProductPaths.GET_PRODUCT}` +
            '/' +
            id,
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

  /* @Post('')
  createProduct() {}

  @Delete('')
  deleteProduct() {} */
}
