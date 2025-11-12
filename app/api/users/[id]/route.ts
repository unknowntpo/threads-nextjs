import { ProfileRepository } from '@/lib/repositories/profile.repository';
import { FollowRepository } from '@/lib/repositories/follow.repository';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     description: Get user profile by ID with follower/following counts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       404:
 *         description: User not found
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const profileRepo = new ProfileRepository();
    const followRepo = new FollowRepository();

    const { id } = await params;

    // Get user profile with counts
    const userWithCounts = await profileRepo.findByIdWithCounts(id);

    if (!userWithCounts) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user is following this user (if authenticated)
    let isFollowing = false;
    if (session?.user?.id && session.user.id !== id) {
      isFollowing = await followRepo.isFollowing(session.user.id, id);
    }

    return NextResponse.json({
      user: userWithCounts,
      isFollowing,
      followerCount: userWithCounts._count.followers,
      followingCount: userWithCounts._count.following,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
