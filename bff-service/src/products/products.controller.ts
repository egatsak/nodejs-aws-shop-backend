import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { Cache } from 'cache-manager';
import { PRODUCTS_CACHE_KEY } from 'src/common/constants';
import { buildResponse, getPathname, handleError } from 'src/common/helpers';
import { ProductPaths } from 'src/common/paths';
import { Product } from 'src/common/types';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get('')
  async getProducts(@Req() req: Request, @Res() res: Response) {
    const products = await this.cacheManager.get<Product[]>(PRODUCTS_CACHE_KEY);
    if (products) {
      return buildResponse(res, 200, products);
    }

    try {
      const result = await firstValueFrom(
        this.httpService.get<Product[]>(
          getPathname(
            process.env.PRODUCT_API_BASE_URL,
            ProductPaths.GET_PRODUCTS,
          ),
          {
            ...(req.headers.authorization && {
              headers: {
                Authorization: req.headers.authorization,
              },
            }),
          },
        ),
      );

      await this.cacheManager.set(PRODUCTS_CACHE_KEY, result.data);

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
        this.httpService.get<Product>(
          getPathname(
            process.env.PRODUCT_API_BASE_URL,
            ProductPaths.GET_PRODUCTS,
            id,
          ),
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

  @Post('')
  async createProduct(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: unknown,
  ) {
    try {
      const result = await firstValueFrom(
        this.httpService.post<Product>(
          getPathname(
            process.env.PRODUCT_API_BASE_URL,
            ProductPaths.POST_PRODUCT,
          ),
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

  /*  @Delete('')
  deleteProduct() {} */
}
