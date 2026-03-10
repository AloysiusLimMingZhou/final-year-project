import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) { }

  async apply(userId: string, doctorData: CreateDoctorDto, fileURL: string) {
    const user = await this.prisma.users.findUnique({ where: { id: BigInt(userId) } })
    if (!user) {
      throw new NotFoundException('User not found')
    }

    const existingDoctor = await this.prisma.doctors.findUnique({ where: { user_id: BigInt(userId) } })
    if (existingDoctor) {
      const statusMessages: Record<string, string> = {
        pending: 'Your doctor application is currently pending review.',
        approved: 'You are already an approved doctor.',
        rejected: 'Your doctor application was rejected. You cannot re-apply.',
        revoked: 'Your doctor status has been revoked. You cannot re-apply.',
      };
      throw new ConflictException(statusMessages[existingDoctor.status] || 'You have already submitted a doctor application.');
    }

    const doctor = await this.prisma.doctors.create({
      data: {
        user_id: BigInt(userId),
        specialization: doctorData.specialization,
        graduated_from: doctorData.graduated_from,
        place_of_practice: doctorData.place_of_practice,
        years_of_experience: doctorData.years_of_experience,
        type_of_registration: doctorData.type_of_registration,
        identification_number: doctorData.identification_number,
        phone_number: doctorData.phone_number,
        doctor_license_url: fileURL,
        status: 'pending'
      }
    })

    return {
      ...doctor,
      user_id: doctor.user_id.toString(),
    }

  }
}
