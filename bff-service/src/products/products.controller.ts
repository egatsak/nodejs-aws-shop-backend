import { HttpService } from '@nestjs/axios';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { buildResponse, getPathname, handleError } from 'src/common/helpers';
import { ProductPaths } from 'src/common/paths';

@Controller('products')
export class ProductsController {
  constructor(private readonly httpService: HttpService) {}

  @Get('')
  async getProducts(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(
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
        this.httpService.post(
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
