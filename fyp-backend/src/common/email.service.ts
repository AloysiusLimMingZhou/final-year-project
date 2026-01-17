import { MailerService } from "@nestjs-modules/mailer";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";

@Injectable()
export class EmailService {
    constructor(
        private readonly mailerService: MailerService,
        private readonly prisma: PrismaService
    ) { }

    generateDiagnosisReport(user_name: string, diagnosis: any) {
        return (diagnosis?.risk_score >= 0.7 ? this.generateHighRiskHTML(user_name, diagnosis) : this.generateLowMediumRiskHTML(user_name, diagnosis))
    }

    generateLowMediumRiskHTML(user_name: string, diagnosis: any) {
        return (
            `
                <div style="background-color: #ffebee; padding: 20px; border: 1px solid red;">
                    <h2>Diagnosis Report</h2>
                    <p>This is an automated message from HealthConnect.</p>
                    <p>User <strong>${user_name}</strong> has just received a diagnosis indicating 
                    <strong style="color: red;">${diagnosis?.band} Risk</strong>.</p>
                    
                    <h3>Details:</h3>
                    <ul>
                        <li>Patient Name: ${user_name}</li>
                        <li>Risk Score: ${diagnosis?.risk_score}</li>
                        <li>Band: ${diagnosis?.band}</li>
                        <li>Time: ${new Date().toLocaleString()}</li>
                    </ul>
            
                    <p>Thank you and have a great day</p>
                </div>
            `
        )
    }

    generateHighRiskHTML(user_name: string, diagnosis: any) {
        return (
            `
                <div style="background-color: #ffebee; padding: 20px; border: 1px solid red;">
                    <h2>Emergency Health Alert</h2>
                    <p>This is an automated message from HealthConnect.</p>
                    <p>User <strong>${user_name}</strong> has just received a diagnosis indicating 
                    <strong style="color: red;">HIGH RISK</strong>.</p>
                    
                    <h3>Details:</h3>
                    <ul>
                        <li>Patient Name: ${user_name}</li>
                        <li>Risk Score: ${diagnosis?.risk_score}</li>
                        <li>Band: ${diagnosis?.band}</li>
                        <li>Time: ${new Date().toLocaleString()}</li>
                    </ul>
            
                    <p>Please contact them immediately.</p>
                </div>
            `
        )
    }

    async sendReportEmail(user_id: string) {
        const user = await this.prisma.users.findUnique({
            where: { id: BigInt(user_id) }
        })

        const diagnosis = await this.prisma.health_prediction.findFirst({
            where: { health: { user_id: BigInt(user_id) } },
            orderBy: { created_at: 'desc' }
        })

        if (!user) throw new NotFoundException('User not found!');
        if (!diagnosis) throw new NotFoundException('Diagnosis record is not found!');

        await this.mailerService.sendMail({
            to: user.email,
            subject: 'Diagnosis Report Email',
            html: this.generateDiagnosisReport(user.name, diagnosis)
        })
    }

    async sendHighRiskAlertEmail(
        user_id: string,
    ) {
        const user = await this.prisma.users.findUnique({
            where: { id: BigInt(user_id) }
        })

        const diagnosis = await this.prisma.health_prediction.findFirst({
            where: { health: { user_id: BigInt(user_id) } },
            orderBy: { created_at: 'desc' }
        })

        if (!user) throw new NotFoundException('User not found!');
        if (!diagnosis) throw new NotFoundException('Diagnosis record is not found!');

        await this.mailerService.sendMail({
            to: user.email,
            subject: 'High Risk Alert',
            html: this.generateDiagnosisReport(user.name, diagnosis)
        })
    }

    async sendEmergencyContactEmail(
        user_id: string,
    ) {
        const user = await this.prisma.users.findUnique({
            where: { id: BigInt(user_id) }
        })

        const diagnosis = await this.prisma.health_prediction.findFirst({
            where: {
                health: { user_id: BigInt(user_id) }
            },
            orderBy: { created_at: 'desc' }
        })

        if (!user) throw new NotFoundException('User not found!');
        if (!diagnosis) throw new NotFoundException('Diagnosis record is not found!');
        if (!user.emergency_contact_email) throw new BadRequestException("No emergency contact email! Can't send email message");

        await this.mailerService.sendMail({
            to: user.emergency_contact_email,
            subject: 'High Risk Alert',
            html: this.generateDiagnosisReport(user.name, diagnosis)
        })
    }

}