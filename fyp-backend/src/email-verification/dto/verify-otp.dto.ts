import { IsString, Matches, IsEmail } from "class-validator";

export class VerifyOtpDto {
    @IsEmail({}, { message: 'Must be a valid email' })
    email: string;

    @IsString()
    @Matches(/^[0-9]{6}$/, { message: 'OTP must be exactly 6 digits' })
    otp: string;
}