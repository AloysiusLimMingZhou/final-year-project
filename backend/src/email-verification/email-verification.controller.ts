import { Controller, HttpCode, Post, Body } from "@nestjs/common";
import { EmailVerificationService } from "./email-verification.service";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { Public } from "../auth/decorators/public.decorator";

@Controller('email-verify')
export class EmailVerificationController {
    constructor(private readonly emailVerificationService: EmailVerificationService) { }

    @Public()
    @Post('verify-otp')
    @HttpCode(200)
    async verifyOTP(@Body() body: VerifyOtpDto) {
        return this.emailVerificationService.verifyUserOTP(body.email, body.otp);
    }

    @Public()
    @Post('verify-emergency-otp')
    @HttpCode(200)
    async verifyEmergencyOTP(@Body() body: VerifyOtpDto) {
        return this.emailVerificationService.verifyEmergencyOTP(body.email, body.otp);
    }

    @Public()
    @Post('verify-password-otp')
    @HttpCode(200)
    async verifyPasswordOTP(@Body() body: VerifyOtpDto) {
        return this.emailVerificationService.verifyPasswordChangeOTP(body.email, body.otp);
    }

    @Public()
    @Post('resend-user-otp')
    @HttpCode(200)
    async resendUserOTP(@Body('email') email: string) {
        const user = await this.emailVerificationService.findUserByEmail(email);
        const otp = await this.emailVerificationService.generateOTP(user);
        await this.emailVerificationService.sendUserVerificationEmail(email, otp);
        return { message: 'Verification code resent to your email.' };
    }

    @Public()
    @Post('resend-emergency-otp')
    @HttpCode(200)
    async resendEmergencyOTP(@Body('email') email: string) {
        const user = await this.emailVerificationService.findUserByEmail(email);
        if (!user.emergency_contact_email) {
            return { message: 'No emergency contact email found.' };
        }
        const otp = await this.emailVerificationService.generateEmergencyOTP(user);
        await this.emailVerificationService.sendEmergencyVerificationEmail(user, otp);
        return { message: 'Verification code resent to emergency contact.' };
    }

    @Public()
    @Post('resend-password-otp')
    @HttpCode(200)
    async resendPasswordOTP(@Body('email') email: string) {
        const user = await this.emailVerificationService.findUserByEmail(email);
        const otp = await this.emailVerificationService.generateOTP(user);
        await this.emailVerificationService.sendPasswordChangeEmail(email, otp);
        return { message: 'Password change verification code resent.' };
    }
}