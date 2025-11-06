import { FollowRepository } from '@/lib/repositories/follow.repository'
import { ProfileRepository } from '@/lib/repositories/profile.repository'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

/**
 * @swagger
 * /api/users/{id}/follow:
 *   post:
 *     description: Follow a user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully followed user
 *       400:
 *         description: Cannot follow yourself or already following
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const followRepo = new FollowRepository()
    const profileRepo = new ProfileRepository()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id: targetUserId } = await params

    // Cannot follow yourself
    if (session.user.id === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Check if target user exists
    const targetUser = await profileRepo.findById(targetUserId)
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already following
    const isAlreadyFollowing = await followRepo.isFollowing(session.user.id, targetUserId)
    if (isAlreadyFollowing) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 })
    }

    // Create follow relationship
    await followRepo.create(session.user.id, targetUserId)

    return NextResponse.json({
      message: 'Successfully followed user',
      isFollowing: true,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * @swagger
 * /api/users/{id}/follow:
 *   delete:
 *     description: Unfollow a user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully unfollowed user
 *       400:
 *         description: Not following this user
 *       401:
 *         description: Not authenticated
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const followRepo = new FollowRepository()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id: targetUserId } = await params

    // Check if currently following
    const isFollowing = await followRepo.isFollowing(session.user.id, targetUserId)
    if (!isFollowing) {
      return NextResponse.json({ error: 'Not following this user' }, { status: 400 })
    }

    // Remove follow relationship
    await followRepo.delete(session.user.id, targetUserId)

    return NextResponse.json({
      message: 'Successfully unfollowed user',
      isFollowing: false,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
