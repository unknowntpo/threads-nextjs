import { prisma } from '@/lib/prisma';
import type { Post } from '@prisma/client';
import { logger } from '@/lib/logger.ts';

export type PostWithUser = Post & {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  _count?: {
    likes: number;
    comments: number;
    reposts: number;
  };
  isLikedByUser?: boolean;
  isRepostedByUser?: boolean;
};

export class PostRepository {
  async findById(id: string): Promise<Post | null> {
    return prisma.post.findUnique({
      where: { id },
    });
  }

  async findByIdWithUser(id: string): Promise<PostWithUser | null> {
    return prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findAll(limit = 50, offset = 0): Promise<PostWithUser[]> {
    return prisma.post.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: string, limit = 50): Promise<Post[]> {
    logger.info('PostRepository.findByUserId', userId);
    return prisma.post.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: { userId: string; content: string; mediaUrls?: string[] }): Promise<Post> {
    return prisma.post.create({
      data: {
        userId: data.userId,
        content: data.content,
        mediaUrls: data.mediaUrls || [],
      },
    });
  }

  async update(id: string, data: { content?: string; mediaUrls?: string[] }): Promise<Post> {
    return prisma.post.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.post.delete({
      where: { id },
    });
  }

  async findAllWithCounts(
    userId: string | undefined,
    limit = 50,
    offset = 0
  ): Promise<PostWithUser[]> {
    const posts = await prisma.post.findMany({
      take: limit,
      skip: offset,
      where: {
        originalPostId: null, // Only show original posts, not reposts
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // Get repost counts manually
    const postsWithCounts = await Promise.all(
      posts.map(async post => {
        const repostCount = await prisma.post.count({
          where: { originalPostId: post.id },
        });

        let isLikedByUser = false;
        let isRepostedByUser = false;

        if (userId) {
          const [like, repost] = await Promise.all([
            prisma.like.findUnique({
              where: {
                userId_postId: {
                  userId,
                  postId: post.id,
                },
              },
            }),
            prisma.post.findFirst({
              where: {
                userId,
                originalPostId: post.id,
              },
            }),
          ]);

          isLikedByUser = !!like;
          isRepostedByUser = !!repost;
        }

        return {
          ...post,
          _count: {
            ...post._count,
            reposts: repostCount,
          },
          isLikedByUser,
          isRepostedByUser,
        };
      })
    );

    return postsWithCounts;
  }

  async getInteractionCounts(postId: string) {
    const [likesCount, commentsCount, repostsCount] = await Promise.all([
      prisma.like.count({ where: { postId } }),
      prisma.comment.count({ where: { postId } }),
      prisma.post.count({ where: { originalPostId: postId } }),
    ]);

    return {
      likes: likesCount,
      comments: commentsCount,
      reposts: repostsCount,
    };
  }

  async isLikedByUser(postId: string, userId: string): Promise<boolean> {
    const like = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
    return !!like;
  }

  async isRepostedByUser(postId: string, userId: string): Promise<boolean> {
    const repost = await prisma.post.findFirst({
      where: {
        userId,
        originalPostId: postId,
      },
    });
    return !!repost;
  }
}
