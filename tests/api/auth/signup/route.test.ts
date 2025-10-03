import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { testApiHandler } from 'next-test-api-route-handler'
import * as appHandler from '../../../../app/api/auth/signup/route'
import { cleanupDatabase, createTestUser } from '@/tests/helpers/db'

describe('POST /api/auth/signup', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  it('should create a new user with valid data', async () => {
    const uniqueEmail = `test-${Date.now()}@example.com`
    const uniqueUsername = `testuser${Date.now()}`

    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const response = await fetch({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: uniqueEmail,
            password: 'Password123!',
            username: uniqueUsername,
            display_name: 'Test User',
          }),
        })

        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.user).toBeDefined()
        expect(data.user.email).toBe(uniqueEmail)
        expect(data.message).toBe('User created successfully')
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
            password: 'Password123!',
            username: 'testuser',
          }),
        })

        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Email, password, and username are required')
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
            email: 'test@example.com',
            username: 'testuser',
          }),
        })

        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Email, password, and username are required')
      },
    })
  })

  it('should return 400 for missing username', async () => {
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
            password: 'Password123!',
          }),
        })

        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Email, password, and username are required')
      },
    })
  })

  it('should return 400 for duplicate email', async () => {
    // First create a user
    await createTestUser({
      email: 'existing@example.com',
      password: 'password123',
      username: 'existinguser',
    })

    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const response = await fetch({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'existing@example.com', // duplicate email
            password: 'Password123!',
            username: `unique${Date.now()}`,
          }),
        })

        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('already')
      },
    })
  })
})
