import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const HEALTH_PATH = '/api/healthz';

/**
 * GET /api/healthz
 *
 * Application health check endpoint.
 *
 * Returns:
 * - 200: {
 *     status: 'ok',
 *     checks: { database: 'ok' },
 *     uptime: number,
 *     timestamp: string
 *   }
 * - 503: {
 *     status: 'error',
 *     checks: { database: 'unreachable' },
 *     timestamp: string
 *   }
 */
export async function GET() {
  const startTime = Date.now();

  logger.apiRequest('GET', HEALTH_PATH);

  try {
    // Ensure database connectivity
    await prisma.$queryRaw`SELECT 1`;

    const duration = Date.now() - startTime;
    logger.apiSuccess('GET', HEALTH_PATH, duration);

    return NextResponse.json({
      status: 'ok',
      checks: {
        database: 'ok',
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.apiError('GET', HEALTH_PATH, error);

    return NextResponse.json(
      {
        status: 'error',
        checks: {
          database: 'unreachable',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
