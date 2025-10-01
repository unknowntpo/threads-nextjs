import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { SignUpRequest } from "@/lib/types/database";

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     description: Create a new user account and profile
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
 *         description: Invalid request or username taken
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: SignUpRequest = await request.json();

    // Validate required fields
    if (!body.email?.trim() || !body.password?.trim() || !body.username?.trim()) {
      return NextResponse.json(
        { error: "Email, password, and username are required" }, 
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
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: "Username is already taken" }, 
        { status: 400 }
      );
    }

    // Create user
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
    });

    if (error) {
      console.error("Signup error:", error);
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }

    // Create profile if user was created
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          username,
          display_name: body.display_name || username,
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // User is created but profile failed - they can complete it later
      }
    }

    return NextResponse.json(
      { 
        message: "User created successfully",
        user: data.user 
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