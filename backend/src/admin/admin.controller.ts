import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decarator';
import { DoctorPaginationDto } from 'src/doctors/dto/doctor-pagination.dto';
import { ParseBigIntPipe } from 'src/common/parse-bigint.pipe';
import { IsVerifiedGuard } from 'src/auth/guards/isverified.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles("admin")
  @Get("pending-doctors")
  async getPendingDoctors(@Query() queries: DoctorPaginationDto) {
    const { page = 1, limit = 10, search } = queries;
    const skip: number = (page - 1) * limit;
    return this.adminService.findPendingDoctorReview({ skip, take: limit, search });
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles("admin")
  @Get(":id/doctor-review")
  async reviewDoctor(@Param('id', ParseBigIntPipe) id: bigint) {
    return await this.adminService.reviewDoctor(id.toString());
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/approve-doctor")
  async approveDoctor(@CurrentUser() user, @Param('id', ParseBigIntPipe) id: bigint) {
    await this.adminService.approveDoctorReview(user.id.toString(), id.toString());
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/reject-doctor")
  async rejectDoctor(@CurrentUser() user, @Param('id', ParseBigIntPipe) id: bigint) {
    await this.adminService.rejectDoctorReview(user.id.toString(), id.toString());
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/revoke-doctor")
  async revokeDoctor(@Param('id', ParseBigIntPipe) id: bigint) {
    await this.adminService.revokeDoctorById(id.toString());
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles("admin")
  @Get("doctors")
  async getAllDoctors(@Query() queries: DoctorPaginationDto) {
    const { page = 1, limit = 10, search } = queries;
    const skip: number = (page - 1) * limit;
    return await this.adminService.findAllDoctors({ skip, take: limit, search });
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles("admin")
  @Get(":id/doctor")
  async getDoctorProfile(@Param('id', ParseBigIntPipe) id: bigint) {
    return await this.adminService.findDoctorById(id.toString());
  }
}
