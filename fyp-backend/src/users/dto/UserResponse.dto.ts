import { IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { sex } from "@prisma/client";

export class UserResponseDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsNumber()
  latitude?: number | null;

  @IsNumber()
  longitude?: number | null;

  @IsString()
  roles: string[];

  @IsNumber()
  age?: number;

  @IsString()
  @IsEnum(sex)
  sex?: sex;

  @IsString()
  @IsOptional()
  emergency_contact_email?: string;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsBoolean()
  @IsOptional()
  isverified?: boolean;

  @IsBoolean()
  @IsOptional()
  emergency_contact_isverified?: boolean;

  @IsDate()
  @IsOptional()
  created_at?: Date | null;

  @IsDate()
  @IsOptional()
  updated_at?: Date | null;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsString()
  @IsOptional()
  graduated_from?: string;

  @IsString()
  @IsOptional()
  place_of_practice?: string;

  @IsNumber()
  @IsOptional()
  years_of_experience?: number;

  @IsString()
  @IsOptional()
  type_of_registration?: string;

  @IsString()
  @IsOptional()
  phone_number?: string;

  @IsString()
  @IsOptional()
  identification_number?: string;

  @IsString()
  @IsOptional()
  doctor_status?: string;
}
