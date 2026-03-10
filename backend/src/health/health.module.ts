import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { HttpModule } from '@nestjs/axios';
import { UsersModule } from 'src/users/users.module';
import { EmailService } from 'src/common/email.service';

@Module({
    imports: [HttpModule, UsersModule],
    controllers: [HealthController],
    providers: [HealthService, EmailService],
})
export class HealthModule { }
