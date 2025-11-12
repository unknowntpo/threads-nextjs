import { prisma } from '@/lib/prisma';
import type { Follow } from '@prisma/client';

export class FollowRepository {
  async create(followerId: string, followingId: string): Promise<Follow> {
    return prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });
  }

  async delete(followerId: string, followingId: string): Promise<void> {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
    return follow !== null;
  }

  async getFollowerCount(userId: string): Promise<number> {
    return prisma.follow.count({
      where: {
        followingId: userId,
      },
    });
  }

  async getFollowingCount(userId: string): Promise<number> {
    return prisma.follow.count({
      where: {
        followerId: userId,
      },
    });
  }
}
