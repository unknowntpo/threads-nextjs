import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import type { CreatePostDTO } from '@/lib/types/entities';
import { auth } from '@/auth';
import { PostRepository } from '@/lib/repositories/post.repository';

const postRepo = new PostRepository();

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('user_id');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 50;
  const maxLimit = 100;

  logger.apiRequest('GET', '/api/posts');

  try {
    const session = await auth();

    if (!session?.user?.id) {
      logger.apiError('GET', '/api/posts', 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((limitParam && limit < 1) || limit > maxLimit) {
      // FIXME: dedicated error type
      const error = new Error('limit must be between 1 and 100');

      logger.apiError('GET', '/api/posts', error, session.user.id);
      return NextResponse.json({ error }, { status: 400 });
    }

    // Fetch posts with user information
    const posts = userId
      ? await postRepo.findByUserId(userId, limit)
      : await postRepo.findAll(limit);

    const duration = Date.now() - startTime;
    logger.apiSuccess('GET', '/api/posts', duration, session.user.id);

    return NextResponse.json({ posts });
  } catch (error) {
    logger.apiError('GET', '/api/posts', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    logger.apiRequest('POST', '/api/posts');

    // Authenticate FIRST before parsing body
    const session = await auth();

    if (!session?.user?.id) {
      logger.apiError('POST', '/api/posts', 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Now parse and validate the request body
    let body: CreatePostDTO;
    try {
      body = await request.json();
    } catch {
      logger.apiError('POST', '/api/posts', 'Invalid JSON in request body', session.user.id);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Validate required fields
    if (!body.content?.trim()) {
      logger.apiError('POST', '/api/posts', 'Content is required', session.user.id);
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Create the post
    const post = await postRepo.create({
      userId: session.user.id,
      content: body.content.trim(),
      mediaUrls: body.image_url ? [body.image_url] : undefined,
    });

    const duration = Date.now() - startTime;
    logger.apiSuccess('POST', '/api/posts', duration, session.user.id);

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    logger.apiError('POST', '/api/posts', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
