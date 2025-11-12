import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * POST /api/posts/[id]/like
 * Like a post
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  const { id: postId } = await params;

  try {
    logger.apiRequest('POST', `/api/posts/${postId}/like`);

    const session = await auth();
    if (!session?.user?.id) {
      logger.apiError('POST', `/api/posts/${postId}/like`, 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      logger.apiError('POST', `/api/posts/${postId}/like`, 'Post not found');
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Create like (will fail if already liked due to unique constraint)
    const like = await prisma.like.create({
      data: {
        userId: session.user.id,
        postId,
      },
    });

    const duration = Date.now() - startTime;
    logger.apiSuccess('POST', `/api/posts/${postId}/like`, duration, session.user.id);

    return NextResponse.json({ like }, { status: 201 });
  } catch (error: unknown) {
    // Handle unique constraint violation (already liked)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      logger.apiError('POST', `/api/posts/${postId}/like`, 'Already liked');
      return NextResponse.json({ error: 'Already liked' }, { status: 400 });
    }

    logger.apiError('POST', `/api/posts/${postId}/like`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/posts/[id]/like
 * Unlike a post
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id: postId } = await params;

  try {
    logger.apiRequest('DELETE', `/api/posts/${postId}/like`);

    const session = await auth();
    if (!session?.user?.id) {
      logger.apiError('DELETE', `/api/posts/${postId}/like`, 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete like
    await prisma.like.delete({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    });

    const duration = Date.now() - startTime;
    logger.apiSuccess('DELETE', `/api/posts/${postId}/like`, duration, session.user.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    // Handle not found (not liked)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      logger.apiError('DELETE', `/api/posts/${postId}/like`, 'Not liked');
      return NextResponse.json({ error: 'Not liked' }, { status: 404 });
    }

    logger.apiError('DELETE', `/api/posts/${postId}/like`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
