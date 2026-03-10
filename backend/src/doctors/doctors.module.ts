import { Module } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { S3Service } from 'src/common/s3.service';

@Module({
  controllers: [DoctorsController],
  providers: [DoctorsService, S3Service],
})
export class DoctorsModule { }
