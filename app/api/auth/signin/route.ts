import { NextRequest, NextResponse } from 'next/server'
import { SignInRequest } from '@/lib/types/entities'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     description: Sign in user with email and password
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
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Sign in successful
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const body: SignInRequest = await request.json()

    // Validate required fields
    if (!body.email?.trim() || !body.password?.trim()) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        username: true,
        displayName: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid login credentials' }, { status: 400 })
    }

    // Verify password
    const isValid = await verifyPassword(body.password, user.passwordHash)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid login credentials' }, { status: 400 })
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    })

    const response = NextResponse.json({
      message: 'Sign in successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
      },
    })

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
