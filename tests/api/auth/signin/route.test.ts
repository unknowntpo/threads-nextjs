import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { testApiHandler } from 'next-test-api-route-handler'
import * as appHandler from '../../../../app/api/auth/signin/route'
import { cleanupDatabase, createTestUser } from '@/tests/helpers/db'

describe('POST /api/auth/signin', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    // Create a test user for signin tests
    await createTestUser({
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
      display_name: 'Test User',
    })
  })

  it('should sign in with valid credentials', async () => {
    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const response = await fetch({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.user).toBeDefined()
        expect(data.user.email).toBe('test@example.com')
      },
    })
  })

  it('should return 400 for missing email', async () => {
    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const response = await fetch({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: 'password123',
          }),
        })

        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Email and password are required')
      },
    })
  })

  it('should return 400 for missing password', async () => {
    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const response = await fetch({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'alice@example.com',
          }),
        })

        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Email and password are required')
      },
    })
  })

  it('should return 400 for invalid credentials', async () => {
    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const response = await fetch({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'invalid@example.com',
            password: 'wrongpassword',
          }),
        })

        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Invalid login credentials')
      },
    })
  })

  it('should return 400 for wrong password', async () => {
    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const response = await fetch({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrongpassword',
          }),
        })

        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Invalid login credentials')
      },
    })
  })
})
