import { createServerSupabaseClient } from "@/lib/db/client";
import { ProfileRepository } from "@/lib/repositories/profile.repository";
import { NextRequest, NextResponse } from "next/server";
import type { CreateProfileDTO, Profile } from "@/lib/types/entities";

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
    const supabase = await createServerSupabaseClient();
    const profileRepo = new ProfileRepository(supabase);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const profile: Profile | null = await profileRepo.findById(user.id);

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user,
      profile
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const profileRepo = new ProfileRepository(supabase);
    const body: CreateProfileDTO = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!body.username?.trim()) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Sanitize username
    const username = body.username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    // Check if username is already taken
    const existingProfile = await profileRepo.findByUsername(username);

    if (existingProfile) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    const profile: Profile = await profileRepo.create({
      id: user.id,
      username,
      display_name: body.display_name || username,
      bio: body.bio || null,
    });

    return NextResponse.json(
      {
        message: "Profile created successfully",
        profile
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}