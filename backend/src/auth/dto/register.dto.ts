import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { sex } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Invalid password length' })
  password: string;

  @IsNumber()
  @IsNotEmpty()
  age: number;

  @IsEnum(sex)
  @IsNotEmpty()
  sex: sex;

  @IsString()
  @IsOptional()
  emergency_contact_email?: string;
}