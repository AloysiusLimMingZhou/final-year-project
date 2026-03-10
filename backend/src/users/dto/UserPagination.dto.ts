import { Type } from "class-transformer";
import { IsOptional } from "class-validator";

export class UserPaginationDto {
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  search?: string;
}