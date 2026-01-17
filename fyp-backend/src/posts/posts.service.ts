import { Injectable, NotFoundException } from '@nestjs/common';
import { blog_posts, blog_posts_status, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

type PostWithRelation = Prisma.blog_postsGetPayload<{
  include: {
    users_blog_posts_user_idTousers: true;
    users_blog_posts_reviewed_byTousers: true;
  }
}>

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) { }

  private toCreatePostDto(post: PostWithRelation) {
    return {
      id: post.id.toString(),
      user_id: post.user_id.toString(),
      title: post.title,
      content: post.content,
      status: post.status,
      category: post.category ?? "Heart",
      created_at: post.created_at ?? null,
      updated_at: post.updated_at ?? null,
      reviewed_by: post.reviewed_by?.toString() ?? null,
      reviewed_at: post.reviewed_at ?? null,
      author_name: post.users_blog_posts_user_idTousers.name,
      reviewer_name: post.users_blog_posts_reviewed_byTousers?.name ?? null,
    };
  }

  private toUpdatePostDto(post: blog_posts) {
    return {
      title: post.title,
      content: post.content,
      status: post.status,
      updated_at: post.updated_at ?? null,
      reviewed_at: post.reviewed_at ?? null
    };
  }

  private createPostDtoToDbInput(dto: CreatePostDto): Omit<Prisma.blog_postsUncheckedCreateInput, 'user_id'> {
    const { reviewed_by, status, ...data } = dto;
    return {
      ...data,
      reviewed_by: reviewed_by ? BigInt(reviewed_by) : null,
      status: status as blog_posts_status,
    }
  }

  private updatePostDtoToDbInput(dto: UpdatePostDto): Prisma.blog_postsUpdateInput {
    const { status, ...data } = dto;
    return {
      ...data,
      status: status as blog_posts_status,
    }
  }

  private async findOne(where: Prisma.blog_postsWhereUniqueInput): Promise<PostWithRelation> {
    const post = await this.prisma.blog_posts.findUnique({
      where: where,
      include: {
        users_blog_posts_user_idTousers: true,
        users_blog_posts_reviewed_byTousers: true
      }
    });
    if (!post) throw new NotFoundException('Posts not found!');
    return post;
  }

  async findPostById(id: string): Promise<CreatePostDto> {
    const post = await this.findOne({
      id: BigInt(id),
    });
    return this.toCreatePostDto(post);
  }

  async findManyPosts(queries: {
    skip?: number,
    take?: number,
    search?: string;
  }): Promise<CreatePostDto[]> {
    const { skip = 0, take = 10, search } = queries ?? {};
    const posts = await this.prisma.blog_posts.findMany({
      skip,
      take,
      where: {
        status: "approved",
        ...(search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } }
          ]
        } : {})
      },
      include: {
        users_blog_posts_user_idTousers: true,
        users_blog_posts_reviewed_byTousers: true,
      },
      orderBy: { created_at: 'desc' },
    })

    return posts.map((post: PostWithRelation) => this.toCreatePostDto(post));
  }

  async createPost(user_id: string, createPostDto: CreatePostDto): Promise<CreatePostDto> {
    const newPost = await this.prisma.blog_posts.create({
      data: { ...this.createPostDtoToDbInput(createPostDto), user_id: BigInt(user_id) },
      include: {
        users_blog_posts_user_idTousers: true,
        users_blog_posts_reviewed_byTousers: true,
      }
    });
    return this.toCreatePostDto(newPost);
  }

  async updatePostById(user_id: string, id: string, updatePostDto: UpdatePostDto): Promise<UpdatePostDto> {
    await this.findOne({ id: BigInt(id) });

    const updatedPost: blog_posts = await this.prisma.blog_posts.update({
      where: { id: BigInt(id), user_id: BigInt(user_id) },
      data: this.updatePostDtoToDbInput(updatePostDto),
    })
    return this.toUpdatePostDto(updatedPost);
  }

  async deletePostById(id: string): Promise<void> {
    const post: blog_posts = await this.findOne({ id: BigInt(id) });

    try {
      if (post) {
        await this.prisma.blog_posts.delete({
          where: { id: BigInt(id) },
        })
      }
    } catch (err) {
      throw new Error('Post might have been deleted by another user!');
    }
  }

  async listAllPendingPostsByUserId(
    userId: string,
    queries: {
      skip?: number,
      take?: number,
      search?: string;
    }
  ): Promise<CreatePostDto[]> {
    const { skip = 0, take = 10, search } = queries ?? {};
    const posts: PostWithRelation[] = await this.prisma.blog_posts.findMany({
      skip,
      take,
      where: {
        status: "pending",
        user_id: BigInt(userId),
        ...(search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } }
          ]
        } : {})
      },
      include: {
        users_blog_posts_reviewed_byTousers: true,
        users_blog_posts_user_idTousers: true
      }
    })
    return posts.map((post: PostWithRelation) => this.toCreatePostDto(post));
  }

  async listOnePendingPostByUserId(id: string, user_id: string): Promise<CreatePostDto> {
    const post = await this.prisma.blog_posts.findFirst({
      where: {
        id: BigInt(id),
        user_id: BigInt(user_id),
        status: "pending"
      },
      include: {
        users_blog_posts_user_idTousers: true,
        users_blog_posts_reviewed_byTousers: true
      }
    })

    if (!post) throw new NotFoundException('Post not found!');

    return this.toCreatePostDto(post);
  }

  async listAllPostsForReview(
    queries: {
      skip?: number,
      take?: number,
      search?: string;
    }
  ): Promise<CreatePostDto[]> {
    const { skip = 0, take = 10, search } = queries ?? {};
    const posts: PostWithRelation[] = await this.prisma.blog_posts.findMany({
      skip,
      take,
      where: {
        status: 'pending',
        ...(search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } }
          ]
        } : {})
      },
      include: {
        users_blog_posts_user_idTousers: true,
        users_blog_posts_reviewed_byTousers: true,
      }
    })
    return posts.map((post: PostWithRelation) => this.toCreatePostDto(post));
  }

  async reviewPostById(id: string): Promise<CreatePostDto> {
    const post: PostWithRelation = await this.findOne({ id: BigInt(id) });
    return this.toCreatePostDto(post);
  }

  async approvePostById(id: string): Promise<void> {
    const post: PostWithRelation = await this.findOne({ id: BigInt(id) });

    if (post.status === 'approved') {
      throw new Error("This post has already been approved!");
    }

    await this.prisma.blog_posts.update({
      where: { id: BigInt(id) },
      data: {
        status: 'approved',
        reviewed_at: new Date(),
        reviewed_by: post.users_blog_posts_reviewed_byTousers?.id
      }
    })
  }

  async rejectPostById(id: string): Promise<void> {
    const post: PostWithRelation = await this.findOne({ id: BigInt(id) });

    if (post.status === 'rejected') {
      throw new Error("This post has already been rejected!");
    }

    await this.prisma.blog_posts.update({
      where: { id: BigInt(id) },
      data: {
        status: 'rejected',
        reviewed_at: new Date(),
        reviewed_by: post.users_blog_posts_reviewed_byTousers?.id
      }
    })
  }
}
