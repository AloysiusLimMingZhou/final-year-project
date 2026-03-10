import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { users } from '@prisma/client';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService) {
    super({
      usernameField: "email",
    });
  }

  async validate(email: string, password: string): Promise<Omit<users, 'hashed_password'>> {
    const user: Omit<users, 'hashed_password'> = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException("User is not found or invalid");
    }
    return user
  }
}