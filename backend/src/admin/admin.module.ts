import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { S3Service } from 'src/common/s3.service';
import { EmailService } from '../common/email.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, S3Service, EmailService],
})
export class AdminModule { }
