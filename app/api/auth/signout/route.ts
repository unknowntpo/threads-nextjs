import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/auth/signout:
 *   post:
 *     description: Sign out the current user
 *     responses:
 *       200:
 *         description: Sign out successful
 *       500:
 *         description: Server error
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out error:", error);
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Sign out successful"
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}