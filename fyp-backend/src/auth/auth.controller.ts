import { Body, Controller, Get, Post, HttpCode, HttpStatus, UseGuards, Req, Res, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';
import type { Response } from 'express';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { GoogleOauthGuard } from './guards/google-oauth.guard';
import { CurrentUser } from './decorators/user.decarator';
import { UserResponseDto } from '../users/dto/UserResponse.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<void> {
    await this.authService.register(registerDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@CurrentUser() user: UserResponseDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(user, res);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleAuth(@Req() req: Request) { }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthRedirect(@CurrentUser() user: UserResponseDto, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.authService.login(user, res);
    return res.redirect('http://localhost:3000/dashboard');
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user) {
    return this.authService.getProfile(user);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): Promise<void> {
    return this.authService.logout(res);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  async refresh(@CurrentUser() user: UserResponseDto, @Res({ passthrough: true }) res: Response): Promise<void> {
    return this.authService.login(user, res);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('verify-password')
  async verifyOldPassword(@CurrentUser() user, @Body() body: { password: string }) {
    return this.authService.verifyPassword(user.id.toString(), body.password);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  async changePassword(@CurrentUser() user, @Body() body: { oldPassword: string, newPassword: string }) {
    return this.authService.changePassword(user.id.toString(), body.oldPassword, body.newPassword);
  }
}
