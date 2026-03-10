import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min } from "class-validator";

export class CreateHealthDto {
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    age: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    sex: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    cp: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    trestbps: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    chol: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    fbs: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    restecg: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    thalach: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    exang: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    oldpeak: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    slope: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    ca: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    thal: number;

    @IsDate()
    @IsOptional()
    recorded_at?: Date;
}