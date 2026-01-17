import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decarator';
import { DoctorPaginationDto } from 'src/doctors/dto/doctor-pagination.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("pending-doctors")
  async getPendingDoctors(@Query() queries: DoctorPaginationDto) {
    const { page = 1, limit = 10, search } = queries;
    const skip: number = (page - 1) * limit;
    return this.adminService.findPendingDoctorReview({ skip, take: limit, search });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get(":id/doctor-review")
  async reviewDoctor(@Param('id') id: string) {
    return await this.adminService.reviewDoctor(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/approve-doctor")
  async approveDoctor(@CurrentUser() user, @Param('id') id: string) {
    await this.adminService.approveDoctorReview(user.id.toString(), id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/reject-doctor")
  async rejectDoctor(@CurrentUser() user, @Param('id') id: string) {
    await this.adminService.rejectDoctorReview(user.id.toString(), id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/revoke-doctor")
  async revokeDoctor(@Param('id') id: string) {
    await this.adminService.revokeDoctorById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("doctors")
  async getAllDoctors(@Query() queries: DoctorPaginationDto) {
    const { page = 1, limit = 10, search } = queries;
    const skip: number = (page - 1) * limit;
    return await this.adminService.findAllDoctors({ skip, take: limit, search });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get(":id/doctor")
  async getDoctorProfile(@Param('id') id: string) {
    return await this.adminService.findDoctorById(id);
  }
}
