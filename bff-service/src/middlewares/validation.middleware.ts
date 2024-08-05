import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { pathToRegexp } from 'path-to-regexp';
import { bffPaths } from 'src/common/paths';

@Injectable()
export class UrlValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const url = req.originalUrl;
    const isValid = this.isUrlValid(url);

    if (!isValid) {
      throw new HttpException('Cannot process request', HttpStatus.BAD_GATEWAY);
    }

    next();
  }

  private isUrlValid(url: string): boolean {
    return bffPaths.some((pattern) => pathToRegexp(pattern).test(url));
  }
}
