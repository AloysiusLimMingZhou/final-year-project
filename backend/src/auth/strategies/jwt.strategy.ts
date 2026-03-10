import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { UserResponseDto } from '../../users/dto/UserResponse.dto';
import { JwtDto } from '../dto/jwt.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private userService: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request)=> request?.cookies?.Authentication
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET')
    });
  }

  async validate(payload: JwtDto) {
    const user:UserResponseDto = await this.userService.findOneById(payload.sub)
    if(!user){
      throw new UnauthorizedException('User does not exist');
    }
    return user
  }
}