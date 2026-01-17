import { OmitType, PartialType } from '@nestjs/mapped-types';
import { UserResponseDto } from './UserResponse.dto';

export class UpdateUserDto extends PartialType(OmitType(UserResponseDto, ['id', 'email', 'latitude', 'longitude', 'sex', 'created_at', 'updated_at', 'roles'] as const)) { }
