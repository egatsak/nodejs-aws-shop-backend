import { Controller, Get, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('bff')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(['', 'ping'])
  healthCheck() {
    return {
      message: 'OK',
      status: HttpStatus.OK,
    };
  }
}
