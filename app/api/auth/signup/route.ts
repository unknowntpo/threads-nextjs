import { NextRequest, NextResponse } from 'next/server'
import { SignUpRequest } from '@/lib/types/entities'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     description: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               username:
 *                 type: string
 *                 minLength: 3
 *               display_name:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *               - username
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid request or username/email taken
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const body: SignUpRequest = await request.json()

    // Validate required fields
    if (!body.email?.trim() || !body.password?.trim() || !body.username?.trim()) {
      return NextResponse.json(
        { error: 'Email, password, and username are required' },
        { status: 400 }
      )
    }

    // Sanitize username
    const username = body.username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()

    if (username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: body.email }, { username }],
      },
    })

    if (existingUser) {
      if (existingUser.email === body.email) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
    }

    // Hash password
    const passwordHash = await hashPassword(body.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        username,
        displayName: body.display_name || username,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        createdAt: true,
      },
    })

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    })

    const response = NextResponse.json(
      {
        message: 'User created successfully',
        user,
      },
      { status: 201 }
    )

    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
