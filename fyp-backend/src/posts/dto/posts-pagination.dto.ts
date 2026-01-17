import { Type } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

export class PostsPaginationDto {
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  search?: string;
}