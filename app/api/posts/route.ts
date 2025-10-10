import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import type { CreatePostDTO } from '@/lib/types/entities'
import { auth } from '@/auth'
import { PostRepository } from '@/lib/repositories/post.repository'

const postRepo = new PostRepository()

export async function GET() {
  const startTime = Date.now()

  try {
    logger.apiRequest('GET', '/api/posts')

    const session = await auth()

    if (!session?.user?.id) {
      logger.apiError('GET', '/api/posts', 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch posts with user information
    const posts = await postRepo.findAll(50)

    const duration = Date.now() - startTime
    logger.apiSuccess('GET', '/api/posts', duration, session.user.id)

    return NextResponse.json({ posts })
  } catch (error) {
    logger.apiError('GET', '/api/posts', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    logger.apiRequest('POST', '/api/posts')

    // Authenticate FIRST before parsing body
    const session = await auth()

    if (!session?.user?.id) {
      logger.apiError('POST', '/api/posts', 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Now parse and validate the request body
    let body: CreatePostDTO
    try {
      body = await request.json()
    } catch {
      logger.apiError('POST', '/api/posts', 'Invalid JSON in request body', session.user.id)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Validate required fields
    if (!body.content?.trim()) {
      logger.apiError('POST', '/api/posts', 'Content is required', session.user.id)
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Create the post
    const post = await postRepo.create({
      userId: session.user.id,
      content: body.content.trim(),
      mediaUrls: body.image_url ? [body.image_url] : undefined,
    })

    const duration = Date.now() - startTime
    logger.apiSuccess('POST', '/api/posts', duration, session.user.id)

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    logger.apiError('POST', '/api/posts', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
