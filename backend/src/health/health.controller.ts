import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from "@nestjs/common";
import { HealthService } from "./health.service";
import { CreateHealthDto } from "./dto/create-health.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CurrentUser } from "src/auth/decorators/user.decarator";
import { EmailService } from "src/common/email.service";
import { IsVerifiedGuard } from "src/auth/guards/isverified.guard";

@Controller('health')
export class HealthController {
    constructor(
        private readonly healthService: HealthService,
        private readonly emailService: EmailService,
    ) { }

    @Get('history')
    @UseGuards(JwtAuthGuard, IsVerifiedGuard)
    async getHealthHistory(@CurrentUser() user) {
        return this.healthService.findMany(user.id.toString());
    }

    @Post()
    @UseGuards(JwtAuthGuard, IsVerifiedGuard)
    async createHealth(@CurrentUser() user, @Body() createHealthDto: CreateHealthDto) {
        return this.healthService.createHealthRecord(user.id.toString(), createHealthDto);
    }

    @Post('predict')
    @UseGuards(JwtAuthGuard, IsVerifiedGuard)
    async predictHealth(@CurrentUser() user, @Body() createHealthDto: CreateHealthDto) {
        return this.healthService.predictHealth(user.id.toString(), createHealthDto);
    }

    @Get('hospitals')
    @UseGuards(JwtAuthGuard, IsVerifiedGuard)
    async getNearestHospital(@CurrentUser() user) {
        return this.healthService.findNearestHospital(user.id.toString());
    }

    @Post('send-report-email')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard, IsVerifiedGuard)
    async sendReportEmail(@CurrentUser() user) {
        await this.emailService.sendReportEmail(user.id.toString());
        return { message: 'Report email sent successfully.' };
    }
}
