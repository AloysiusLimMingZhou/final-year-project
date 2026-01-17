import { IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { registration_type } from "@prisma/client";

export class CreateDoctorDto {
    @IsString()
    @IsNotEmpty()
    identification_number: string;

    @IsString()
    @IsNotEmpty()
    phone_number: string;

    @IsString()
    @IsNotEmpty()
    specialization: string;

    @IsString()
    @IsNotEmpty()
    graduated_from: string;

    @IsString()
    @IsNotEmpty()
    place_of_practice: string;

    @IsEnum(registration_type)
    @IsNotEmpty()
    type_of_registration: registration_type;

    @IsNumber()
    @IsNotEmpty()
    years_of_experience: number;
}
