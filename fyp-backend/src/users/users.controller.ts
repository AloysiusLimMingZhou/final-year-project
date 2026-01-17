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

@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly pdfService: PdfService
  ) { }

  @Get('sex-category')
  getSexCategory() {
    return Object.values(sex);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user) {
    return this.userService.getProfile(user.id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOneById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findOneById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async findMany(@Query() query: UserPaginationDto): Promise<UserResponseDto[]> {
    const { page = 1, limit = 2, search } = query;
    const skip: number = (page - 1) * limit;
    return this.userService.findMany({ skip, take: limit, search });
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(
    @CurrentUser() user,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.userService.updateById(user.id.toString(), updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile')
  deleteAccount(@CurrentUser() user): Promise<void> {
    return this.userService.deleteById(user.id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteById(@Param('id') id: string): Promise<void> {
    return this.userService.deleteById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('location')
  async updateLocation(@CurrentUser() user, @Body() userLocation: { latitude: number; longitude: number }): Promise<void> {
    return this.userService.updateLocation(user.id.toString(), userLocation.latitude, userLocation.longitude);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile/change-password')
  async changePassword(@CurrentUser() user, @Body() body: { oldPassword: string, newPassword: string }) {
    return this.authService.changePassword(user.id.toString(), body.oldPassword, body.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-emergency-contact-email')
  async sendEmergencyContactEmail(
    @CurrentUser() user
  ) {
    await this.emailService.sendEmergencyContactEmail(user.id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-alert-email')
  async sendAlertEmail(
    @CurrentUser() user
  ) {
    await this.emailService.sendHighRiskAlertEmail(user.id.toString());
  }

  @UseGuards(JwtAuthGuard)
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
}
