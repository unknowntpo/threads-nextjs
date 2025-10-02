import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { SignInRequest } from "@/lib/types/entities";

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
    const supabase = await createClient();
    const body: SignInRequest = await request.json();

    // Validate required fields
    if (!body.email?.trim() || !body.password?.trim()) {
      return NextResponse.json(
        { error: "Email and password are required" }, 
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) {
      console.error("Sign in error:", error);
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Sign in successful",
      user: data.user
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}