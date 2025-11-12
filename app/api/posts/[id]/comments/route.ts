import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * GET /api/posts/[id]/comments
 * Get comments for a post
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  const { id: postId } = await params;

  try {
    logger.apiRequest('GET', `/api/posts/${postId}/comments`);

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const comments = await prisma.comment.findMany({
      where: { postId },
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

    const duration = Date.now() - startTime;
    logger.apiSuccess('GET', `/api/posts/${postId}/comments`, duration);

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error) {
    logger.apiError('GET', `/api/posts/${postId}/comments`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/posts/[id]/comments
 * Create a comment on a post
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  const { id: postId } = await params;

  try {
    logger.apiRequest('POST', `/api/posts/${postId}/comments`);

    const session = await auth();
    if (!session?.user?.id) {
      logger.apiError('POST', `/api/posts/${postId}/comments`, 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { content: string };
    try {
      body = await request.json();
    } catch {
      logger.apiError('POST', `/api/posts/${postId}/comments`, 'Invalid JSON in request body');
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!body.content?.trim()) {
      logger.apiError('POST', `/api/posts/${postId}/comments`, 'Content is required');
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      logger.apiError('POST', `/api/posts/${postId}/comments`, 'Post not found');
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        userId: session.user.id,
        postId,
        content: body.content.trim(),
      },
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

    const duration = Date.now() - startTime;
    logger.apiSuccess('POST', `/api/posts/${postId}/comments`, duration, session.user.id);

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    logger.apiError('POST', `/api/posts/${postId}/comments`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
