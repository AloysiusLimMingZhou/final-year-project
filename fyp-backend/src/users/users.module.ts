import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { EmailService } from 'src/common/email.service';
import { PdfService } from 'src/common/pdf.service';
import { UsersController } from './users.controller';
import { AuthService } from 'src/auth/auth.service';

@Module({
  providers: [UsersService, AuthService, EmailService, PdfService],
  controllers: [UsersController],
  exports: [UsersService],
})

export class UsersModule { }