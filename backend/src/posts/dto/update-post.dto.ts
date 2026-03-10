import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(OmitType(CreatePostDto, ['created_at', 'reviewed_by'] as const)) { }
