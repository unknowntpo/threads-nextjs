import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import type { UpdatePostDTO } from '@/lib/types/entities'
import { auth } from '@/auth'
import { PostRepository } from '@/lib/repositories/post.repository'

const postRepo = new PostRepository()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()

  try {
    const { id } = await params
    logger.apiRequest('GET', `/api/posts/${id}`)

    const session = await auth()

    if (!session?.user?.id) {
      logger.apiError('GET', `/api/posts/${id}`, 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch specific post with user information
    const post = await postRepo.findByIdWithUser(id)

    if (!post) {
      logger.apiError('GET', `/api/posts/${id}`, 'Post not found')
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const duration = Date.now() - startTime
    logger.apiSuccess('GET', `/api/posts/${id}`, duration, session.user.id)

    return NextResponse.json({ post })
  } catch (error) {
    const { id } = await params
    logger.apiError('GET', `/api/posts/${id}`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()

  try {
    const { id } = await params
    const body: UpdatePostDTO = await request.json()
    logger.apiRequest('PUT', `/api/posts/${id}`)

    const session = await auth()

    if (!session?.user?.id) {
      logger.apiError('PUT', `/api/posts/${id}`, 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if post exists and belongs to user
    const existingPost = await postRepo.findById(id)
    if (!existingPost) {
      logger.apiError('PUT', `/api/posts/${id}`, 'Post not found')
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (existingPost.userId !== session.user.id) {
      logger.apiError('PUT', `/api/posts/${id}`, 'Forbidden')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the post
    const updateData: { content?: string; mediaUrls?: string[] } = {}
    if (body.content) {
      updateData.content = body.content.trim()
    }
    if (body.image_url !== undefined) {
      updateData.mediaUrls = body.image_url ? [body.image_url] : []
    }

    const post = await postRepo.update(id, updateData)

    const duration = Date.now() - startTime
    logger.apiSuccess('PUT', `/api/posts/${id}`, duration, session.user.id)

    return NextResponse.json({ post })
  } catch (error) {
    const { id } = await params
    logger.apiError('PUT', `/api/posts/${id}`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()

  try {
    const { id } = await params
    logger.apiRequest('DELETE', `/api/posts/${id}`)

    const session = await auth()

    if (!session?.user?.id) {
      logger.apiError('DELETE', `/api/posts/${id}`, 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if post exists and belongs to user
    const existingPost = await postRepo.findById(id)
    if (!existingPost) {
      logger.apiError('DELETE', `/api/posts/${id}`, 'Post not found')
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (existingPost.userId !== session.user.id) {
      logger.apiError('DELETE', `/api/posts/${id}`, 'Forbidden')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the post
    await postRepo.delete(id)

    const duration = Date.now() - startTime
    logger.apiSuccess('DELETE', `/api/posts/${id}`, duration, session.user.id)

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    const { id } = await params
    logger.apiError('DELETE', `/api/posts/${id}`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
