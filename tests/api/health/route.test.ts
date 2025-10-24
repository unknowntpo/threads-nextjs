import { describe, it, expect, afterEach, vi } from 'vitest'

import { GET } from '@/app/api/healthz/route'
import { prisma } from '@/lib/prisma'

describe('Healthz API', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns ok status when dependencies respond', async () => {
    const response = await GET()

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.status).toBe('ok')
    expect(body.checks.database).toBe('ok')
    expect(typeof body.uptime).toBe('number')
    expect(typeof body.timestamp).toBe('string')
  })

  it('returns service unavailable when database is unreachable', async () => {
    vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('connection refused'))

    const response = await GET()

    expect(response.status).toBe(503)

    const body = await response.json()

    expect(body.status).toBe('error')
    expect(body.checks.database).toBe('unreachable')
    expect(typeof body.timestamp).toBe('string')
  })
})
