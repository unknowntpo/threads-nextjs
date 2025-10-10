import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * POST /api/posts/[id]/repost
 * Repost a post (creates a new post with originalPostId)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()
  const { id: postId } = await params

  try {
    logger.apiRequest('POST', `/api/posts/${postId}/repost`)

    const session = await auth()
    if (!session?.user?.id) {
      logger.apiError('POST', `/api/posts/${postId}/repost`, 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if post exists
    const originalPost = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!originalPost) {
      logger.apiError('POST', `/api/posts/${postId}/repost`, 'Post not found')
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user already reposted this post
    const existingRepost = await prisma.post.findFirst({
      where: {
        userId: session.user.id,
        originalPostId: postId,
      },
    })

    if (existingRepost) {
      logger.apiError('POST', `/api/posts/${postId}/repost`, 'Already reposted')
      return NextResponse.json({ error: 'Already reposted' }, { status: 400 })
    }

    // Create repost (a new post with originalPostId)
    const repost = await prisma.post.create({
      data: {
        userId: session.user.id,
        content: originalPost.content,
        mediaUrls: originalPost.mediaUrls,
        originalPostId: postId,
      },
    })

    const duration = Date.now() - startTime
    logger.apiSuccess('POST', `/api/posts/${postId}/repost`, duration, session.user.id)

    return NextResponse.json({ repost }, { status: 201 })
  } catch (error) {
    logger.apiError('POST', `/api/posts/${postId}/repost`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/posts/[id]/repost
 * Undo repost (delete the repost)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id: postId } = await params

  try {
    logger.apiRequest('DELETE', `/api/posts/${postId}/repost`)

    const session = await auth()
    if (!session?.user?.id) {
      logger.apiError('DELETE', `/api/posts/${postId}/repost`, 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find and delete the repost
    const repost = await prisma.post.findFirst({
      where: {
        userId: session.user.id,
        originalPostId: postId,
      },
    })

    if (!repost) {
      logger.apiError('DELETE', `/api/posts/${postId}/repost`, 'Repost not found')
      return NextResponse.json({ error: 'Repost not found' }, { status: 404 })
    }

    await prisma.post.delete({
      where: { id: repost.id },
    })

    const duration = Date.now() - startTime
    logger.apiSuccess('DELETE', `/api/posts/${postId}/repost`, duration, session.user.id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    logger.apiError('DELETE', `/api/posts/${postId}/repost`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
