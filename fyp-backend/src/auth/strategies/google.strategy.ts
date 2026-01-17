import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow("GOOGLE_CLIENT_ID"),
      clientSecret: configService.getOrThrow("GOOGLE_CLIENT_SECRET"),
      callbackURL: configService.getOrThrow("GOOGLE_CALLBACK_URL"),
      scope: ['profile', 'email']
    });
  }

  async validate(access_token: string, refresh_token: string, profile: any, done: VerifyCallback) {
    try {
      const { name, emails, photos } = profile;

      const googleProfile = {
        email: emails[0].value,
        firstName: name?.givenName || '',
        lastName: name?.familyName || '',
        picture: photos[0]?.value || '',
      };

      const user = await this.authService.validateOAuthLogin(googleProfile);

      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}