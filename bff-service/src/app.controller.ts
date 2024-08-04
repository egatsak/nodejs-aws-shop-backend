import { Controller, Get, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
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
