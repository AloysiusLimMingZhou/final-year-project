import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { MailerService } from "@nestjs-modules/mailer";
import { users } from "@prisma/client";
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmailVerificationService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private mailerService: MailerService
  ) { }

  async findUserByEmail(email: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) throw new NotFoundException("No user is found with this email!");
    return user;
  }

  async findUserByEmergencyEmail(email: string) {
    const user = await this.prisma.users.findFirst({ where: { emergency_contact_email: email } });
    if (!user) throw new NotFoundException("No user found with this emergency contact email!");
    return user;
  }

  async generateOTP(user: users): Promise<string> {
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashed_otp = await bcrypt.hash(otp, 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        verification_token: hashed_otp,
        token_expires_at: expiresAt,
      },
    });
    return otp;
  }

  async generateEmergencyOTP(user: users): Promise<string> {
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashed_otp = await bcrypt.hash(otp, 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        emergency_contact_token: hashed_otp,
        emergency_contact_token_expires_at: expiresAt,
      },
    });
    return otp;
  }

  private generateOTPEmailHTML(recipientName: string, otp: string, purpose: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HealthConnect Verification</title>
</head>
<body style="margin:0;padding:0;background-color:#f7fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:2px solid #6366f1;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#6366f1;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">HealthConnect</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Email Verification</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:15px;color:#2d3748;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#4a5568;">
                ${purpose}
              </p>
              <div style="text-align:center;margin:0 0 24px;">
                <div style="display:inline-block;background-color:#f0f0ff;border:2px solid #6366f1;border-radius:12px;padding:16px 32px;">
                  <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#6366f1;">${otp}</span>
                </div>
              </div>
              <p style="margin:0 0 8px;font-size:13px;color:#718096;">
                This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
              </p>
              <p style="margin:0;font-size:12px;color:#a0aec0;font-style:italic;">
                If you did not request this verification, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#f7fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#718096;">
                &copy; ${new Date().getFullYear()} HealthConnect &middot; Your heart health companion
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  async sendUserVerificationEmail(email: string, rawOTP: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User is not found!');

    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your email for HealthConnect',
      html: this.generateOTPEmailHTML(user.name, rawOTP, 'Please use the following code to verify your email address for HealthConnect.'),
    });
  }

  async sendEmergencyVerificationEmail(user: users, rawOTP: string) {
    if (!user.emergency_contact_email) return;

    await this.mailerService.sendMail({
      to: user.emergency_contact_email,
      subject: `${user.name} has added you as their emergency contact in HealthConnect`,
      html: this.generateOTPEmailHTML(
        user.name,
        rawOTP,
        `<strong>${user.name}</strong> has added your email as their emergency contact in HealthConnect. Please verify your email using the code below to confirm.`
      ),
    });
  }

  async sendPasswordChangeEmail(email: string, rawOTP: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User is not found!');

    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Change Request - HealthConnect',
      html: this.generateOTPEmailHTML(user.name, rawOTP, 'You requested to change your password. Use the code below to confirm your identity.'),
    });
  }

  async verifyUserOTP(email: string, otp: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User is not found!');
    const token = user.verification_token;
    const token_expiration = user.token_expires_at;
    if (!token_expiration || !token) throw new BadRequestException("No verification token found!")
    const now = new Date();
    if (token_expiration < now) throw new BadRequestException('OTP has expired! Please request a new one.');
    const isValid = await bcrypt.compare(otp.toString(), token);
    if (!isValid) throw new BadRequestException('Invalid OTP!');
    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        isverified: true,
        verification_token: null,
        token_expires_at: null,
      },
    });
  }

  async verifyEmergencyOTP(email: string, otp: string) {
    const user = await this.prisma.users.findFirst({ where: { emergency_contact_email: email } });
    if (!user) throw new BadRequestException('No user found with this emergency contact email!');
    const emergency_token = user.emergency_contact_token;
    const emergency_token_expiration = user.emergency_contact_token_expires_at;
    if (!emergency_token_expiration || !emergency_token) throw new BadRequestException("No verification token found!")
    const now = new Date();
    if (emergency_token_expiration < now) throw new BadRequestException('OTP has expired! Please request a new one.');
    const isValid = await bcrypt.compare(otp.toString(), emergency_token);
    if (!isValid) throw new BadRequestException('Invalid OTP!');
    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        emergency_contact_isverified: true,
        emergency_contact_token: null,
        emergency_contact_token_expires_at: null,
      },
    });
  }

  async verifyPasswordChangeOTP(email: string, otp: string): Promise<{ sessionToken: string }> {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User is not found!');
    const token = user.verification_token;
    const token_expiration = user.token_expires_at;
    if (!token_expiration || !token) throw new BadRequestException("No verification token found!")
    const now = new Date();
    if (token_expiration < now) throw new BadRequestException('OTP has expired! Please request a new one.');
    const isValid = await bcrypt.compare(otp.toString(), token);
    if (!isValid) throw new BadRequestException('Invalid OTP!');

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const hashedSession = await bcrypt.hash(sessionToken, 10);
    const sessionExpiry = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        verification_token: hashedSession,
        token_expires_at: sessionExpiry,
      },
    });

    return { sessionToken };
  }

  async verifyPasswordChangeSession(email: string, sessionToken: string): Promise<void> {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User is not found!');
    const token = user.verification_token;
    const token_expiration = user.token_expires_at;
    if (!token_expiration || !token) throw new BadRequestException("Password change session expired. Please request a new one.");
    const now = new Date();
    if (token_expiration < now) throw new BadRequestException('Password change session expired. Please request a new one.');
    const isValid = await bcrypt.compare(sessionToken, token);
    if (!isValid) throw new BadRequestException('Invalid session. Please request a new password change.');

    // Clear the token after successful verification
    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        verification_token: null,
        token_expires_at: null,
      },
    });
  }
}