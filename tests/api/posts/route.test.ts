import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testApiHandler } from 'next-test-api-route-handler'
import * as appHandler from '@/app/api/posts/route'
import { cleanupDatabase, createTestUser } from '@/tests/helpers/db'
import { prisma } from '@/lib/prisma'

// Mock NextAuth for API route testing
// Note: Keycloak is configured in vitest.setup.ts for future E2E testing
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

import { auth } from '@/auth'

describe('POST /api/posts', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    vi.clearAllMocks()
  })

  it('should create a new post with valid data', async () => {
    const user = await createTestUser({
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
      display_name: 'Test User',
    })

    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id, email: user.email },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const response = await fetch({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: 'This is my first post!',
          }),
        })

        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.post).toBeDefined()
        expect(data.post.content).toBe('This is my first post!')
        expect(data.post.userId).toBe(user.id)
      },
    })
  })

  it('should return 400 for missing content', async () => {
    const user = await createTestUser({
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
    })

    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id, email: user.email },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const response = await fetch({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })

        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Content is required')
      },
    })
  })

  it('should return 401 for unauthenticated request', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const response = await fetch({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: 'This should fail',
          }),
        })

        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized')
      },
    })
  })
})

describe('GET /api/posts', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    vi.clearAllMocks()
  })

  it('should return all posts', async () => {
    const user = await createTestUser({
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
      display_name: 'Test User',
    })

    await prisma.post.createMany({
      data: [
        { userId: user.id, content: 'Post 1' },
        { userId: user.id, content: 'Post 2' },
        { userId: user.id, content: 'Post 3' },
      ],
    })

    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id, email: user.email },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const response = await fetch({
          method: 'GET',
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.posts).toBeDefined()
        expect(data.posts).toHaveLength(3)
        expect(data.posts[0].user).toBeDefined()
        expect(data.posts[0].user.username).toBe('testuser')
      },
    })
  })

  it('should return 401 for unauthenticated request', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const response = await fetch({
          method: 'GET',
        })

        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized')
      },
    })
  })
})
