import { Injectable, NotFoundException } from '@nestjs/common';
import { users, Prisma, registration_type } from '@prisma/client';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { UserResponseDto } from './dto/UserResponse.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  private toResponseDto(user: any): UserResponseDto {
    const roles = user.users_roles
      ? user.users_roles.map((ur) => ur.roles.name)
      : [];

    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      latitude: user.latitude,
      longitude: user.longitude,
      roles: roles,
      age: user.age,
      sex: user.sex,
      emergency_contact_email: user.emergency_contact_email,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  private async findOne(
    where: Prisma.usersWhereUniqueInput,
  ): Promise<any> {
    const user = await this.prisma.users.findUnique({
      where,
      include: {
        users_roles: {
          include: {
            roles: true
          }
        }
      }
    });
    if (!user) throw new NotFoundException('User is not found!');
    return user;
  }

  async findOneById(id: string): Promise<UserResponseDto> {
    const user = await this.findOne({ id: BigInt(id) });
    return this.toResponseDto(user);
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    search?: string;
  }): Promise<UserResponseDto[]> {
    const { skip = 0, take = 2, search } = params ?? {};
    const users = await this.prisma.users.findMany({
      skip,
      take,
      where: search
        ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
        : undefined,
      orderBy: { created_at: 'desc' },
      include: {
        users_roles: {
          include: {
            roles: true
          }
        }
      }
    });

    return users.map((user: any): UserResponseDto => this.toResponseDto(user));
  }

  async updateById(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(id) },
      include: {
        users_roles: {
          include: {
            roles: true
          }
        },
        doctors_doctors_user_idTousers: true
      }
    });
    if (!user) throw new NotFoundException('User is not found!');

    const { specialization, graduated_from, place_of_practice, type_of_registration, years_of_experience, identification_number, phone_number, ...updateUserData } = updateUserDto;

    const updatedUser = await this.prisma.users.update({
      where: { id: BigInt(id) },
      data: updateUserData,
      include: {
        users_roles: {
          include: {
            roles: true
          }
        }
      }
    });

    if (user.doctors_doctors_user_idTousers) {
      const updateDoctorData: any = {};
      if (specialization) updateDoctorData.specialization = specialization;
      if (graduated_from) updateDoctorData.graduated_from = graduated_from;
      if (place_of_practice) updateDoctorData.place_of_practice = place_of_practice;
      if (type_of_registration) updateDoctorData.type_of_registration = type_of_registration as registration_type;
      if (years_of_experience) updateDoctorData.years_of_experience = years_of_experience;
      if (identification_number) updateDoctorData.identification_number = identification_number;
      if (phone_number) updateDoctorData.phone_number = phone_number;

      if (Object.keys(updateDoctorData).length > 0) {
        await this.prisma.doctors.update({
          where: { user_id: BigInt(id) },
          data: updateDoctorData,
        });
      }
    }

    return this.toResponseDto(updatedUser);
  }

  async deleteById(id: string): Promise<void> {
    const user = await this.prisma.users.findUnique({ where: { id: BigInt(id) } });
    if (!user) throw new NotFoundException('User is not found!');
    await this.prisma.users.delete({ where: { id: BigInt(id) } });
  }

  async getProfile(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(id) },
      include: {
        users_roles: { include: { roles: true } },
        doctors_doctors_user_idTousers: true
      }
    })
    const toResponseDtoUser = this.toResponseDto(user);
    if (user?.doctors_doctors_user_idTousers) {
      return {
        ...toResponseDtoUser,
        specialization: user.doctors_doctors_user_idTousers.specialization,
        graduated_from: user.doctors_doctors_user_idTousers.graduated_from,
        place_of_practice: user.doctors_doctors_user_idTousers.place_of_practice,
        type_of_registration: user.doctors_doctors_user_idTousers.type_of_registration,
        years_of_experience: user.doctors_doctors_user_idTousers.years_of_experience,
        identification_number: user.doctors_doctors_user_idTousers.identification_number,
        phone_number: user.doctors_doctors_user_idTousers.phone_number,
      }
    }
    return toResponseDtoUser;
  }

  async updateLocation(id: string, latitude: number, longitude: number): Promise<void> {
    await this.prisma.users.update({
      where: { id: BigInt(id) },
      data: { latitude: latitude, longitude: longitude },
    })
  }
}
