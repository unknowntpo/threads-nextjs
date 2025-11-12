import { ProfileRepository } from '@/lib/repositories/profile.repository';
import { NextRequest, NextResponse } from 'next/server';
import type { CreateProfileDTO, UpdateProfileDTO } from '@/lib/types/entities';
import { auth } from '@/auth';

/**
 * @swagger
 * /api/profiles:
 *   get:
 *     description: Get current user's profile
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Profile not found
 *   post:
 *     description: Create user profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *               display_name:
 *                 type: string
 *               bio:
 *                 type: string
 *             required:
 *               - username
 *     responses:
 *       201:
 *         description: Profile created successfully
 *       400:
 *         description: Invalid request or username taken
 *       401:
 *         description: Not authenticated
 */
export async function GET() {
  try {
    const session = await auth();
    const profileRepo = new ProfileRepository();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const profile = await profileRepo.findById(session.user.id);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: session.user,
      profile,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const profileRepo = new ProfileRepository();
    const body: CreateProfileDTO = await request.json();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Validate required fields
    if (!body.username?.trim()) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Sanitize username
    const username = body.username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Check if username is already taken
    const existingProfile = await profileRepo.findByUsername(username);

    if (existingProfile) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    const profile = await profileRepo.update(session.user.id, {
      username,
      displayName: body.display_name || username,
      bio: body.bio || undefined,
    });

    return NextResponse.json(
      {
        message: 'Profile created successfully',
        profile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/profiles:
 *   put:
 *     description: Update current user's profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name:
 *                 type: string
 *                 maxLength: 255
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               avatar_url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Not authenticated
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const profileRepo = new ProfileRepository();
    const body: UpdateProfileDTO = await request.json();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Validate displayName length
    if (body.display_name && body.display_name.length > 255) {
      return NextResponse.json(
        { error: 'Display name must be 255 characters or less' },
        { status: 400 }
      );
    }

    // Validate bio length
    if (body.bio && body.bio.length > 500) {
      return NextResponse.json({ error: 'Bio must be 500 characters or less' }, { status: 400 });
    }

    // Validate avatar URL format (basic check)
    if (body.avatar_url) {
      try {
        new URL(body.avatar_url);
      } catch {
        return NextResponse.json({ error: 'Invalid avatar URL format' }, { status: 400 });
      }
    }

    // Build update data (only include provided fields)
    const updateData: {
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
    } = {};

    if (body.display_name !== undefined) {
      updateData.displayName = body.display_name || undefined;
    }
    if (body.bio !== undefined) {
      updateData.bio = body.bio || undefined;
    }
    if (body.avatar_url !== undefined) {
      updateData.avatarUrl = body.avatar_url || undefined;
    }

    const profile = await profileRepo.update(session.user.id, updateData);

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
