import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';
import { S3Service } from 'src/common/s3.service';

@Injectable()
export class AdminService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly s3Service: S3Service
    ) { }

    async findAllDoctors(queries: {
        skip?: number,
        take?: number,
        search?: string
    }) {
        const { skip = 0, take = 10, search } = queries ?? {};
        const doctors = await this.prisma.doctors.findMany({
            skip,
            take,
            where: {
                status: "approved",
                ...(search ? {
                    users_doctors_user_idTousers: {
                        name: { contains: search, mode: "insensitive" }
                    }
                } : {})
            },
            include: {
                users_doctors_user_idTousers: true
            }
        })

        return doctors.map((doctor) => ({
            ...doctor,
            user_id: doctor.user_id.toString(),
            name: doctor.users_doctors_user_idTousers.name,
            email: doctor.users_doctors_user_idTousers.email,
            reviewed_by: doctor.reviewed_by?.toString() || null,
            doctor_license_url: doctor.doctor_license_url
        }))
    }

    async findDoctorById(doctor_id: string) {
        const doctor = await this.prisma.doctors.findUnique({
            where: { user_id: BigInt(doctor_id) },
            include: {
                users_doctors_user_idTousers: true
            }
        })

        if (!doctor) throw new NotFoundException('Doctor not found!')

        const doctorLicenseURL = await this.s3Service.getPresignedURL(doctor.doctor_license_url);

        return {
            ...doctor,
            user_id: doctor.user_id.toString(),
            name: doctor.users_doctors_user_idTousers?.name,
            email: doctor.users_doctors_user_idTousers?.email,
            doctor_license_url: doctorLicenseURL
        }
    }

    async revokeDoctorById(doctor_id: string) {
        const doctor = await this.prisma.doctors.findUnique({
            where: { user_id: BigInt(doctor_id) }
        });
        if (!doctor) throw new NotFoundException('Doctor not found!');

        await this.prisma.doctors.delete({
            where: { user_id: BigInt(doctor_id) }
        })
    }

    async findPendingDoctorReview(queries: {
        skip?: number,
        take?: number,
        search?: string
    }) {
        const { skip = 0, take = 10, search } = queries ?? {};
        const doctors = await this.prisma.doctors.findMany({
            skip,
            take,
            where: {
                status: "pending",
                ...(search ? {
                    users_doctors_user_idTousers: {
                        name: { contains: search, mode: "insensitive" }
                    }
                } : {})
            },
            include: {
                users_doctors_user_idTousers: true
            }
        });

        return doctors.map((doctor) => ({
            ...doctor,
            user_id: doctor.user_id.toString(),
            name: doctor.users_doctors_user_idTousers?.name,
            email: doctor.users_doctors_user_idTousers?.email,
            doctor_license_url: doctor.doctor_license_url
        }));
    }

    async reviewDoctor(doctorID: string) {
        const doctor = await this.prisma.doctors.findUnique({
            where: {
                user_id: BigInt(doctorID),
                status: "pending"
            },
            include: {
                users_doctors_user_idTousers: true
            }
        });

        if (!doctor) throw new NotFoundException('Doctor not found!');

        const doctorLicenseURL = await this.s3Service.getPresignedURL(doctor.doctor_license_url);

        return {
            ...doctor,
            user_id: doctor.user_id.toString(),
            name: doctor.users_doctors_user_idTousers?.name,
            email: doctor.users_doctors_user_idTousers?.email,
            doctor_license_url: doctorLicenseURL
        }
    }

    async approveDoctorReview(adminID: string, doctorID: string) {
        await this.prisma.doctors.update({
            where: {
                user_id: BigInt(doctorID)
            },
            data: {
                status: "approved",
                reviewed_by: BigInt(adminID),
                reviewed_at: new Date()
            }
        })

        const doctorRole: any = await this.prisma.roles.findFirst({
            where: { name: "doctor" }
        })

        if (!doctorRole) await this.prisma.roles.upsert({
            where: { name: "doctor" },
            update: {},
            create: {
                name: "doctor"
            }
        });

        const existingRole = await this.prisma.users_roles.findUnique({
            where: {
                user_id_role_id: {
                    user_id: BigInt(doctorID),
                    role_id: doctorRole.id
                }
            }
        })

        if (!existingRole) {
            await this.prisma.users.update({
                where: {
                    id: BigInt(doctorID)
                },
                data: {
                    users_roles: {
                        create: {
                            role_id: doctorRole.id
                        }
                    }
                }
            })
        }
    }

    async rejectDoctorReview(adminID: string, doctorID: string) {
        await this.prisma.doctors.update({
            where: {
                user_id: BigInt(doctorID)
            },
            data: {
                status: "rejected",
                reviewed_by: BigInt(adminID),
                reviewed_at: new Date()
            }
        })
    }
}
