import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { blog_posts_status } from '@prisma/client';
import { blogs_category } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(blogs_category)
  category: blogs_category;

  @IsOptional()
  @IsEnum(blog_posts_status)
  status?: blog_posts_status;

  @IsOptional()
  created_at: Date | null;

  @IsOptional()
  updated_at: Date | null;

  @IsOptional()
  reviewed_by: string | null;

  @IsOptional()
  reviewed_at: Date | null;

  @IsString()
  @IsOptional()
  author_name: string;

  @IsString()
  @IsOptional()
  reviewer_name: string | null;
}
