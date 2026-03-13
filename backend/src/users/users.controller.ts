import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body, Query, UseGuards,
  Post,
  Res,
} from '@nestjs/common';
import { ParseBigIntPipe } from 'src/common/parse-bigint.pipe';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { UserResponseDto } from './dto/UserResponse.dto';
import { UserPaginationDto } from './dto/UserPagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/user.decarator';
import { AuthService } from '../auth/auth.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { sex } from '@prisma/client';
import { EmailService } from 'src/common/email.service';
import { PdfService } from 'src/common/pdf.service';
import { IsVerifiedGuard } from 'src/auth/guards/isverified.guard';
import { EmailVerificationService } from 'src/email-verification/email-verification.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly pdfService: PdfService,
    private readonly emailVerificationService: EmailVerificationService,
  ) { }

  @Get('sex-category')
  getSexCategory() {
    return Object.values(sex);
  }

  // No IsVerifiedGuard — unverified users need to view their profile
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user) {
    return this.userService.getProfile(user.id.toString());
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async findMany(@Query() query: UserPaginationDto): Promise<UserResponseDto[]> {
    const { page = 1, limit = 2, search } = query;
    const skip: number = (page - 1) * limit;
    return this.userService.findMany({ skip, take: limit, search });
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard)
  @Get('diagnosis/download')
  async downloadDiagnosisPDF(@CurrentUser() user, @Res() res) {
    const buffer: any = await this.pdfService.generateDiagnosisPDF(user.id.toString());
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="diagnosis_${user.name}_${Date.now()}.pdf"`,
      'Content-Length': buffer.length
    })
    res.send(buffer);
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard)
  @Get(':id')
  async findOneById(@Param('id', ParseBigIntPipe) id: bigint): Promise<UserResponseDto> {
    return this.userService.findOneById(id.toString());
  }


  @UseGuards(JwtAuthGuard, IsVerifiedGuard)
  @Put('profile')
  updateProfile(
    @CurrentUser() user,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.userService.updateById(user.id.toString(), updateUserDto);
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard)
  @Delete('profile')
  deleteAccount(@CurrentUser() user): Promise<void> {
    return this.userService.deleteById(user.id.toString());
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard)
  @Delete(':id')
  deleteById(@Param('id', ParseBigIntPipe) id: bigint): Promise<void> {
    return this.userService.deleteById(id.toString());
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard)
  @Put('location')
  async updateLocation(@CurrentUser() user, @Body() userLocation: { latitude: number; longitude: number }): Promise<void> {
    return this.userService.updateLocation(user.id.toString(), userLocation.latitude, userLocation.longitude);
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard)
  @Put('profile/change-password')
  async changePassword(@CurrentUser() user, @Body() body: { sessionToken: string, newPassword: string }) {
    return this.authService.changePassword(user.id.toString(), body.sessionToken, body.newPassword);
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard)
  @Post('send-emergency-verification')
  async sendEmergencyVerification(@CurrentUser() user) {
    const fullUser = await this.emailVerificationService.findUserByEmail(user.email);
    if (!fullUser.emergency_contact_email) {
      return { message: 'No emergency contact email found.' };
    }
    const otp = await this.emailVerificationService.generateEmergencyOTP(fullUser);
    await this.emailVerificationService.sendEmergencyVerificationEmail(fullUser, otp);
    return { message: 'Verification email sent to emergency contact.' };
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard)
  @Post('send-emergency-contact-email')
  async sendEmergencyContactEmail(
    @CurrentUser() user
  ) {
    await this.emailService.sendEmergencyContactEmail(user.id.toString());
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard)
  @Post('send-alert-email')
  async sendAlertEmail(
    @CurrentUser() user
  ) {
    await this.emailService.sendHighRiskAlertEmail(user.id.toString());
  }


}
