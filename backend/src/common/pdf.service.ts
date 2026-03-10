import { Injectable, NotFoundException } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { PrismaService } from "prisma/prisma.service";

@Injectable()
export class PdfService {
    constructor(private readonly prisma: PrismaService) { };

    async generateDiagnosisPDF(user_id: string) {
        const user = await this.prisma.users.findUnique({
            where: { id: BigInt(user_id) },
            include: {
                health: true,
            }
        });

        const diagnosis = await this.prisma.health_prediction.findFirst({
            where: {
                health: { user_id: BigInt(user_id) }
            },
            orderBy: { created_at: 'desc' }
        });

        const healthResult = await this.prisma.health.findFirst({
            where: {
                user_id: BigInt(user_id)
            },
            orderBy: { recorded_at: 'desc' }
        });

        if (!user) throw new NotFoundException('User not found!');
        if (!diagnosis) throw new NotFoundException('Diagnosis record is not found!');
        if (!healthResult) throw new NotFoundException('Health record is not found!');

        const mapSex = (val: any) => val === 1 ? '1 (Male)' : val === 0 ? '0 (Female)' : val;

        const mapCp = (val: any) => {
            if (val === 1) return '1 (Typical angina (Squeezing and tightness pain in the chest))';
            if (val === 2) return '2 (Atypical angina (Chest pain that is not under angina but still due to lack of oxygen to the heart))';
            if (val === 3) return '3 (Non-anginal pain (Chest pain that is not caused by heart disease))';
            if (val === 4) return '4 (Asymptomatic (No chest pain but might still have heart disease))';
            return val;
        };

        const mapFbs = (val: any) => val === 1 ? '1 (True)' : val === 0 ? '0 (False)' : val;

        const mapRestEcg = (val: any) => {
            if (val === 0) return '0 (Normal result)';
            if (val === 1) return '1 (Abnormal heart muscle relaxation through ECG T-Wave)';
            if (val === 2) return "2 (Probable or confirmed thickening of heart's left ventricle (Left ventricular hypertrophy))";
            return val;
        };

        const mapExang = (val: any) => val === 1 ? '1 (Yes)' : val === 0 ? '0 (No)' : val;

        const mapCa = (val: any) => {
            if (val === 0) return '0 (No blocked vessels)';
            if (val === 1) return '1 (One major vessel blocked)';
            if (val === 2) return '2 (Two major vessels blocked)';
            if (val === 3) return '3 (Three major vessels blocked)';
            return val;
        };

        const mapThal = (val: any) => {
            if (val === 3) return '3 (Normal blood flow)';
            if (val === 6) return '6 (Fixed Defect (Part of heart muscle permanently damaged))';
            if (val === 7) return '7 (Reversible Defect (Blood flow reduced during exercise which indicated artery blockage))';
            return val;
        };

        return new Promise((resolve) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));

            doc.fontSize(25).text('Medical Diagnosis Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Date: ${diagnosis?.created_at?.toLocaleDateString()}`);

            doc.moveDown();

            doc.fontSize(14).text(`Patient Information:`);
            doc.fontSize(12).text(`Name: ${user?.name}`);

            doc.fontSize(14).text(`Health Information:`);
            doc.fontSize(12).text(`Age: ${healthResult?.age}`);
            doc.fontSize(12).text(`Sex: ${mapSex(healthResult?.sex)}`);
            doc.fontSize(12).text(`Chest Pain: ${mapCp(healthResult?.cp)}`);
            doc.fontSize(12).text(`Blood Pressure: ${healthResult?.trestbps} mmHg`);
            doc.fontSize(12).text(`Cholesterol: ${healthResult?.chol}`);
            doc.fontSize(12).text(`Fasting Blood Sugar: ${mapFbs(healthResult?.fbs)}`);
            doc.fontSize(12).text(`Resting Electrocardiogram: ${mapRestEcg(healthResult?.restecg)}`);
            doc.fontSize(12).text(`Maximum Heart Rate: ${healthResult?.thalach}`);
            doc.fontSize(12).text(`Exercise Induced Angina: ${mapExang(healthResult?.exang)}`);
            doc.fontSize(12).text(`OldPeak (ST Depression): ${healthResult?.oldpeak}`);
            doc.fontSize(12).text(`Slope: ${healthResult?.slope}`);
            doc.fontSize(12).text(`Number of Vessels: ${mapCa(healthResult?.ca)}`);
            doc.fontSize(12).text(`Thalassemia: ${mapThal(healthResult?.thal)}`);

            doc.moveDown();
            doc.fontSize(14).text(`Prediction Results:`);
            doc.fontSize(12).text(`Risk Score: ${(diagnosis?.risk_score * 100).toFixed(2)}%`);
            doc.fontSize(12).text(`Band: ${diagnosis?.band}`);
            doc.fontSize(10).fillColor('gray').text(`Disclaimer: The prediction result is done by an AI Machine Learning Model for educational support. It does not replace professional medical diagnosis and advice.`);

            doc.end();
        });
    }
}