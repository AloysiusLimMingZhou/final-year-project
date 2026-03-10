import { Body, Controller, FileTypeValidator, Get, ParseFilePipe, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { CurrentUser } from 'src/auth/decorators/user.decarator';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from 'src/common/s3.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { registration_type } from '@prisma/client';

@Controller('doctors')
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly s3Service: S3Service
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('apply')
  @UseInterceptors(FileInterceptor('file'))
  async doctorVerification(
    @CurrentUser() user,
    @Body() doctorData: CreateDoctorDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'pdf' })]
      })
    ) file: Express.Multer.File) {
    const uniqueFileName = `${user.id.toString()}-doctor-${user.name}-license-${Date.now()}.pdf`

    const fileURL = await this.s3Service.uploadFile(uniqueFileName, file.buffer);

    await this.doctorsService.apply(user.id.toString(), doctorData, fileURL);
  }

  @UseGuards(JwtAuthGuard)
  @Get('type-of-registration')
  getRegistrationType() {
    return Object.values(registration_type);
  }
}
