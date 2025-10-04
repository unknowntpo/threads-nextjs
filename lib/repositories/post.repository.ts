import { prisma } from '@/lib/prisma'
import type { Post } from '@prisma/client'

export type PostWithUser = Post & {
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

export class PostRepository {
  async findById(id: string): Promise<Post | null> {
    return prisma.post.findUnique({
      where: { id },
    })
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
    })
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
    })
  }

  async findByUserId(userId: string, limit = 50): Promise<Post[]> {
    return prisma.post.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: { userId: string; content: string; mediaUrls?: string[] }): Promise<Post> {
    return prisma.post.create({
      data: {
        userId: data.userId,
        content: data.content,
        mediaUrls: data.mediaUrls || [],
      },
    })
  }

  async update(id: string, data: { content?: string; mediaUrls?: string[] }): Promise<Post> {
    return prisma.post.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.post.delete({
      where: { id },
    })
  }
}
