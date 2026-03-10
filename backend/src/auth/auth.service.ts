import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { users } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { JwtDto } from './dto/jwt.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config'
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/UserResponse.dto';
import { EmailVerificationService } from 'src/email-verification/email-verification.service';
import { VerifyOtpDto } from 'src/email-verification/dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private userService: UsersService,
    private emailVerificationService: EmailVerificationService,
    private prisma: PrismaService
  ) { }

  private async hash(password: string, saltOrRounds: number): Promise<string> {
    return await bcrypt.hash(password, saltOrRounds);
  }

  async validateEmailAuth(email: string): Promise<users> {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User is not found!');

    return user;
  }

  async validateUser(email: string, password: string): Promise<Omit<users, 'hashed_password'>> {
    const user = await this.validateEmailAuth(email);
    const isValid: boolean = await bcrypt.compare(password, user.hashed_password);
    if (!isValid) throw new UnauthorizedException("Invalid email or password");
    const { hashed_password, ...result } = user;
    return result;
  }

  async register(registerDto: RegisterDto): Promise<void> {
    const email = registerDto.email
    const existingUser = await this.prisma.users.findUnique({ where: { email } })
    if (existingUser) {
      throw new ConflictException("User email already exists!");
    }

    const hashedPassword: string = await this.hash(registerDto.password, 10)

    const memberRole: any = await this.prisma.roles.findFirst({
      where: { name: "user" }
    })

    if (!memberRole) await this.prisma.roles.upsert({
      where: { name: "user" },
      update: {},
      create: {
        name: "user"
      }
    });

    const user: any = await this.prisma.users.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        hashed_password: hashedPassword,
        latitude: null,
        longitude: null,
        age: registerDto.age,
        sex: registerDto.sex,
        provider: "local",
        emergency_contact_email: registerDto.emergency_contact_email,
        users_roles: {
          create: {
            roles: {
              connect: { id: memberRole.id }
            }
          }
        }
      }
    });
    const rawOTP = await this.emailVerificationService.generateOTP(user);
    await this.emailVerificationService.sendUserVerificationEmail(registerDto.email, rawOTP);

    if (registerDto.emergency_contact_email) {
      const rawEmergencyOTP = await this.emailVerificationService.generateEmergencyOTP(user);
      await this.emailVerificationService.sendEmergencyVerificationEmail(user, rawEmergencyOTP);
    }
  }

  login(user, res: Response) {
    const payload: JwtDto = { sub: user.id.toString(), username: user.name }

    const access_token: string = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION'), // If ever crash wrap this.configService with parseInt
    });

    const refresh_token: string = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION'),
    })

    res.cookie('Authentication', access_token, {
      httpOnly: true,
      sameSite: true,
      secure: false,
      maxAge: 1000 * 60 * 60,
    });

    res.cookie('Refresh', refresh_token, {
      httpOnly: true,
      sameSite: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    })
  }

  async validateOAuthLogin(googleProfile: any): Promise<any> {
    const { email, firstName, lastName, ...any } = googleProfile;

    const user = await this.prisma.users.findUnique({
      where: { email },
      include: {
        users_roles: {
          include: { roles: true }
        }
      },
    })

    if (user) return user;

    const memberRole: any = await this.prisma.roles.findFirst({
      where: { name: "user" }
    })

    if (!memberRole) throw new InternalServerErrorException("User role is not found in the database")

    const hashed_password: string = await this.hash(randomUUID(), 10);

    const newUser = await this.prisma.users.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: email,
        hashed_password: hashed_password,
        latitude: null,
        longitude: null,
        age: null,
        sex: null,
        isverified: true,
        provider: "google",
        emergency_contact_email: null,
        users_roles: {
          create: {
            roles: {
              connect: { id: memberRole.id }
            }
          }
        }
      }
    })

    return newUser;
  }

  async getProfile(user: users) {
    return user
  }

  async logout(res: Response): Promise<void> {
    res.clearCookie('Authentication');
    res.clearCookie('Refresh');
  }

  async verifyUserRefreshToken(refreshToken: string, userId: string): Promise<UserResponseDto> {
    // To-dos: maybe can add refresh token into database so that can directly compare for better security constraint
    return await this.userService.findOneById(userId);
  }

  async verifyPassword(id: string, password: string): Promise<boolean> {
    const user = await this.prisma.users.findUnique({ where: { id: BigInt(id) } })
    if (!user) throw new NotFoundException('User is not found!');

    const isValid: boolean = await bcrypt.compare(password, user.hashed_password);
    if (!isValid) throw new UnauthorizedException('Invalid password! Please try again!');
    return isValid;
  }

  async changePassword(id: string, sessionToken: string, newPassword: string): Promise<void> {
    const user = await this.prisma.users.findUnique({ where: { id: BigInt(id) } });
    if (!user) throw new NotFoundException('User is not found!');

    // Verify the password-change session token (set after OTP verification)
    await this.emailVerificationService.verifyPasswordChangeSession(user.email, sessionToken);

    const hashed_password = await this.hash(newPassword, 10);
    await this.prisma.users.update({
      where: { id: BigInt(id) },
      data: { hashed_password: hashed_password }
    })
  }

  async requestPasswordChangeOTP(id: string): Promise<void> {
    const user = await this.prisma.users.findUnique({ where: { id: BigInt(id) } });
    if (!user) throw new NotFoundException('User is not found!');
    if (user.provider !== 'local') throw new UnauthorizedException('Password change is only available for local accounts.');

    const rawOTP = await this.emailVerificationService.generateOTP(user);
    await this.emailVerificationService.sendPasswordChangeEmail(user.email, rawOTP);
  }
}
