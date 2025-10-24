import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  TrackInteractionRequest,
  BatchTrackInteractionRequest,
  TrackInteractionResponse,
  InteractionType,
} from '@/lib/types/tracking'

/**
 * POST /api/track
 *
 * Track user interactions with posts (views, clicks, likes, shares)
 * Supports both single and batch tracking
 *
 * Body:
 * Single: { post_id: string, interaction_type: string, metadata?: object }
 * Batch: { interactions: [{ post_id, interaction_type, metadata? }] }
 *
 * Returns:
 * - 200: { success: true, tracked: number }
 * - 400: { error: string } - Invalid request body
 * - 401: { error: string } - Unauthorized (no session)
 * - 500: { error: string } - Internal server error
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    logger.apiRequest('POST', '/api/track')

    // Authenticate user
    const session = await auth()

    if (!session?.user?.id) {
      logger.apiError('POST', '/api/track', 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Parse request body
    let body: TrackInteractionRequest | BatchTrackInteractionRequest
    try {
      body = await request.json()
    } catch {
      logger.apiError('POST', '/api/track', 'Invalid JSON body')
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Determine if batch or single tracking
    const isBatch = 'interactions' in body
    const interactions: TrackInteractionRequest[] = isBatch
      ? (body as BatchTrackInteractionRequest).interactions
      : [body as TrackInteractionRequest]

    // Validate interactions
    const validationErrors: string[] = []
    const validatedInteractions: TrackInteractionRequest[] = []

    for (let i = 0; i < interactions.length; i++) {
      const interaction = interactions[i]
      const index = isBatch ? `[${i}]` : ''

      // Validate post_id
      if (!interaction.post_id || typeof interaction.post_id !== 'string') {
        validationErrors.push(`${index} post_id is required and must be a string`)
        continue
      }

      // Validate interaction_type
      const validTypes: InteractionType[] = ['view', 'click', 'like', 'share']
      if (
        !interaction.interaction_type ||
        !validTypes.includes(interaction.interaction_type as InteractionType)
      ) {
        validationErrors.push(`${index} interaction_type must be one of: ${validTypes.join(', ')}`)
        continue
      }

      // Validate metadata (optional)
      if (interaction.metadata !== undefined && typeof interaction.metadata !== 'object') {
        validationErrors.push(`${index} metadata must be an object if provided`)
        continue
      }

      validatedInteractions.push(interaction)
    }

    // If all interactions invalid, return error
    if (validatedInteractions.length === 0 && validationErrors.length > 0) {
      logger.apiError('POST', '/api/track', 'Validation failed')
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }

    // Store interactions in database
    const createdInteractions = await prisma.userInteraction.createMany({
      data: validatedInteractions.map(interaction => ({
        userId,
        postId: interaction.post_id,
        interactionType: interaction.interaction_type,
        metadata: interaction.metadata
          ? (interaction.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      })),
      skipDuplicates: false, // Allow duplicate interactions (e.g., multiple views)
    })

    const duration = Date.now() - startTime
    logger.apiSuccess('POST', '/api/track', duration, userId)
    logger.info('Tracking completed', {
      userId,
      tracked: createdInteractions.count,
      errors: validationErrors.length,
    })

    const response: TrackInteractionResponse = {
      success: true,
      tracked: createdInteractions.count,
    }

    if (validationErrors.length > 0) {
      response.errors = validationErrors
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.apiError('POST', '/api/track', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
