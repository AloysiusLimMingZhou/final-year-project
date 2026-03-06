import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, Put } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decarator';
import { blogs_category } from '@prisma/client';
import { PostsPaginationDto } from './dto/posts-pagination.dto';
import { ParseBigIntPipe } from 'src/common/parse-bigint.pipe';
import { IsVerifiedGuard } from 'src/auth/guards/isverified.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Get('category')
  getCategory() {
    return Object.values(blogs_category)
  }

  @Post('create-post')
  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles('doctor')
  create(@CurrentUser() user, @Body() createPostDto: CreatePostDto): Promise<CreatePostDto> {
    return this.postsService.createPost(user.id.toString(), createPostDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, IsVerifiedGuard)
  findMany(@Query() query: PostsPaginationDto): Promise<CreatePostDto[]> {
    const { page = 1, limit = 20, search, category } = query;
    const skip: number = (page - 1) * limit;
    return this.postsService.findManyPosts({ skip, take: limit, search, category });
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles('doctor')
  @Get('pending-posts')
  getAllPendingPostsByUserId(@CurrentUser() user, @Query() query: PostsPaginationDto): Promise<CreatePostDto[]> {
    const { page = 1, limit = 20, search, category } = query;
    const skip: number = (page - 1) * limit;
    return this.postsService.listAllPendingPostsByUserId(user.id.toString(), { skip, take: limit, search, category });
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles('admin')
  @Get('review-posts')
  listPostsForReview(@Query() query: PostsPaginationDto): Promise<CreatePostDto[]> {
    const { page = 1, limit = 20, search, category } = query;
    const skip: number = (page - 1) * limit;
    return this.postsService.listAllPostsForReview({ skip, take: limit, search, category });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, IsVerifiedGuard)
  findOne(@Param('id', ParseBigIntPipe) id: bigint): Promise<CreatePostDto> {
    return this.postsService.findPostById(id.toString());
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles('doctor')
  @Put(':id/update-post')
  update(@CurrentUser() user, @Param('id', ParseBigIntPipe) id: bigint, @Body() updatePostDto: UpdatePostDto): Promise<UpdatePostDto> {
    return this.postsService.updatePostById(user.id.toString(), id.toString(), updatePostDto);
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles('doctor')
  @Get(':id/pending-posts')
  getOnePendingPostByUserId(@Param('id', ParseBigIntPipe) id: bigint, @CurrentUser() user) {
    return this.postsService.listOnePendingPostByUserId(id.toString(), user.id.toString())
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id/delete-post')
  remove(@Param('id', ParseBigIntPipe) id: bigint): Promise<void> {
    return this.postsService.deletePostById(id.toString());
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles('admin')
  @Get(':id/review-post')
  reviewPost(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.postsService.reviewPostById(id.toString());
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles('admin')
  @Post(':id/approve-post')
  approve(@CurrentUser() user, @Param('id', ParseBigIntPipe) id: bigint): Promise<void> {
    return this.postsService.approvePostById(id.toString(), user.id.toString())
  }

  @UseGuards(JwtAuthGuard, IsVerifiedGuard, RolesGuard)
  @Roles('admin')
  @Post(':id/reject-post')
  reject(@CurrentUser() user, @Param('id', ParseBigIntPipe) id: bigint): Promise<void> {
    return this.postsService.rejectPostById(id.toString(), user.id.toString())
  }
}
