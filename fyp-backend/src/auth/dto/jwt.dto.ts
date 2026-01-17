import { IsString } from 'class-validator';

export class JwtDto {
  @IsString()
  sub: string;

  @IsString()
  username: string;
}