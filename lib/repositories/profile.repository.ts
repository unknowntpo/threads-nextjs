import { prisma } from '@/lib/prisma'
import type { User } from '@prisma/client'

export class ProfileRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    })
  }

  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    })
  }

  async findByIdWithCounts(id: string): Promise<
    | (User & {
        _count: {
          followers: number
          following: number
        }
      })
    | null
  > {
    return prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    })
  }

  async create(data: {
    email: string
    username: string
    displayName?: string
    bio?: string
    avatarUrl?: string
  }): Promise<User> {
    return prisma.user.create({
      data,
    })
  }

  async update(
    id: string,
    data: {
      username?: string
      displayName?: string
      bio?: string
      avatarUrl?: string
    }
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    })
  }
}
