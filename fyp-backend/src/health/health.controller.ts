import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { HealthService } from "./health.service";
import { CreateHealthDto } from "./dto/create-health.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CurrentUser } from "src/auth/decorators/user.decarator";
import { UserResponseDto } from "src/users/dto/UserResponse.dto";

@Controller('health')
export class HealthController {
    constructor(
        private readonly healthService: HealthService,
    ) { }

    @Get('history')
    @UseGuards(JwtAuthGuard)
    async getHealthHistory(@CurrentUser() user) {
        return this.healthService.findMany(user.id.toString());
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    async createHealth(@CurrentUser() user, @Body() createHealthDto: CreateHealthDto) {
        return this.healthService.createHealthRecord(user.id.toString(), createHealthDto);
    }

    @Post('predict')
    @UseGuards(JwtAuthGuard)
    async predictHealth(@CurrentUser() user, @Body() createHealthDto: CreateHealthDto) {
        return this.healthService.predictHealth(user.id.toString(), createHealthDto);
    }

    @Get('hospitals')
    @UseGuards(JwtAuthGuard)
    async getNearestHospital(@CurrentUser() user) {
        return this.healthService.findNearestHospital(user.id.toString());
    }
}
