import { MailerService } from "@nestjs-modules/mailer";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";

// Band thresholds – kept in sync with the ML router
const BAND_THRESHOLDS = { low: 0.40, high: 0.70 };

type RiskBand = "Low" | "Medium" | "High";

interface BandStyle {
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  subject: string;
  headline: string;
  callToAction: string;
}

function getBandStyle(risk_score: number): BandStyle {
  if (risk_score >= BAND_THRESHOLDS.high) {
    return {
      label: "High",
      bgColor: "#fff5f5",
      borderColor: "#e53e3e",
      textColor: "#c53030",
      badgeBg: "#e53e3e",
      badgeText: "#ffffff",
      subject: "⚠️ High Risk Alert – HealthConnect",
      headline: "Emergency Health Alert",
      callToAction:
        "Your result indicates a <strong>HIGH</strong> risk level. Please consult a qualified clinician or seek medical attention as soon as possible.",
    };
  } else if (risk_score >= BAND_THRESHOLDS.low) {
    return {
      label: "Moderate",
      bgColor: "#fffaf0",
      borderColor: "#dd6b20",
      textColor: "#c05621",
      badgeBg: "#dd6b20",
      badgeText: "#ffffff",
      subject: "Moderate Risk Result – HealthConnect",
      headline: "Diagnosis Report",
      callToAction:
        "Your result indicates a <strong>MODERATE</strong> risk level. We recommend scheduling a check-up with your doctor and monitoring your lifestyle habits.",
    };
  } else {
    return {
      label: "Low",
      bgColor: "#f0fff4",
      borderColor: "#38a169",
      textColor: "#276749",
      badgeBg: "#38a169",
      badgeText: "#ffffff",
      subject: "Low Risk Result – HealthConnect",
      headline: "Diagnosis Report",
      callToAction:
        "Your result indicates a <strong>LOW</strong> risk level. Keep up the great work maintaining a healthy lifestyle!",
    };
  }
}

function generateDiagnosisHTML(user_name: string, diagnosis: any): string {
  const riskScore: number = Number(diagnosis?.risk_score ?? 0);
  const style = getBandStyle(riskScore);
  const scorePercent = Math.round(riskScore * 100);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${style.headline}</title>
</head>
<body style="margin:0;padding:0;background-color:#f7fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:${style.bgColor};border-radius:12px;border:2px solid ${style.borderColor};overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:${style.borderColor};padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                HealthConnect
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${style.headline}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:15px;color:#2d3748;">
                Hello <strong>${user_name}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#4a5568;">
                This is an automated report from <strong>HealthConnect</strong>. Your latest heart disease risk screening result is available below.
              </p>

              <!-- Risk Badge -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background-color:${style.badgeBg};color:${style.badgeText};padding:10px 22px;border-radius:50px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                    ${style.label} Risk
                  </td>
                </tr>
              </table>

              <!-- Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="6" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#718096;width:140px;">Patient Name</td>
                        <td style="font-size:13px;color:#2d3748;font-weight:600;">${user_name}</td>
                      </tr>
                      <tr style="background-color:#f7fafc;">
                        <td style="font-size:13px;color:#718096;">Risk Score</td>
                        <td style="font-size:13px;color:${style.textColor};font-weight:700;">${scorePercent}%</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#718096;">Risk Band</td>
                        <td style="font-size:13px;color:${style.textColor};font-weight:700;">${style.label}</td>
                      </tr>
                      <tr style="background-color:#f7fafc;">
                        <td style="font-size:13px;color:#718096;">Date &amp; Time</td>
                        <td style="font-size:13px;color:#2d3748;">${new Date().toLocaleString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to action -->
              <p style="margin:0 0 24px;font-size:14px;color:#4a5568;background-color:#ffffff;border-left:4px solid ${style.borderColor};padding:14px 16px;border-radius:4px;">
                ${style.callToAction}
              </p>

              <!-- Disclaimer -->
              <p style="margin:0;font-size:12px;color:#a0aec0;font-style:italic;">
                ⚠️ Educational estimate only. This is <strong>not</strong> a medical diagnosis. Always consult a qualified healthcare professional for medical advice.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#edf2f7;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#718096;">
                © ${new Date().getFullYear()} HealthConnect · This email was sent because you requested a report of your results.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
}

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly prisma: PrismaService
  ) { }

  generateDiagnosisReport(user_name: string, diagnosis: any) {
    return generateDiagnosisHTML(user_name, diagnosis);
  }

  generateLowMediumRiskHTML(user_name: string, diagnosis: any) {
    return generateDiagnosisHTML(user_name, diagnosis);
  }

  generateHighRiskHTML(user_name: string, diagnosis: any) {
    return generateDiagnosisHTML(user_name, diagnosis);
  }

  async sendReportEmail(user_id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(user_id) }
    });

    const diagnosis = await this.prisma.health_prediction.findFirst({
      where: { health: { user_id: BigInt(user_id) } },
      orderBy: { created_at: 'desc' }
    });

    if (!user) throw new NotFoundException('User not found!');
    if (!diagnosis) throw new NotFoundException('Diagnosis record is not found!');

    const style = getBandStyle(Number(diagnosis.risk_score ?? 0));

    await this.mailerService.sendMail({
      to: user.email,
      subject: style.subject,
      html: generateDiagnosisHTML(user.name, diagnosis)
    });
  }

  async sendHighRiskAlertEmail(user_id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(user_id) }
    });

    const diagnosis = await this.prisma.health_prediction.findFirst({
      where: { health: { user_id: BigInt(user_id) } },
      orderBy: { created_at: 'desc' }
    });

    if (!user) throw new NotFoundException('User not found!');
    if (!diagnosis) throw new NotFoundException('Diagnosis record is not found!');

    await this.mailerService.sendMail({
      to: user.email,
      subject: '⚠️ High Risk Alert – HealthConnect',
      html: generateDiagnosisHTML(user.name, diagnosis)
    });
  }

  async sendEmergencyContactEmail(user_id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(user_id) }
    });

    const diagnosis = await this.prisma.health_prediction.findFirst({
      where: {
        health: { user_id: BigInt(user_id) }
      },
      orderBy: { created_at: 'desc' }
    });

    if (!user) throw new NotFoundException('User not found!');
    if (!diagnosis) throw new NotFoundException('Diagnosis record is not found!');
    if (!user.emergency_contact_email) throw new BadRequestException("No emergency contact email! Can't send email message");

    await this.mailerService.sendMail({
      to: user.emergency_contact_email,
      subject: 'Your Person in Care Heart Prediction Report – HealthConnect',
      html: generateDiagnosisHTML(user.name, diagnosis)
    });
  }
}