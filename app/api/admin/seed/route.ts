import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Admin user configuration
const ADMIN_CONFIG = {
  email: 'admin@threads.local',
  password: 'admin123456', // Change this to a secure password
  username: 'admin',
  display_name: 'System Admin',
  bio: 'System administrator account for testing and management.'
};

/**
 * @swagger
 * /api/admin/seed:
 *   post:
 *     description: Create admin user for testing (development only)
 *     responses:
 *       200:
 *         description: Admin user created successfully
 *       400:
 *         description: Admin user already exists or error
 *       500:
 *         description: Server error
 */
export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Admin seeding not allowed in production' },
      { status: 403 }
    );
  }

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable' },
      { status: 500 }
    );
  }

  try {
    const supabase = await createClient();

    // Check if admin user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', ADMIN_CONFIG.username)
      .single();

    if (existingProfile) {
      return NextResponse.json({
        message: 'Admin user already exists',
        profile: existingProfile
      });
    }

    // Create service client for admin operations
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create admin user using admin API
    const { data: userData, error: createError } = await serviceClient.auth.admin.createUser({
      email: ADMIN_CONFIG.email,
      password: ADMIN_CONFIG.password,
      email_confirm: true, // Skip email confirmation
    });

    if (createError) {
      console.error('Admin user creation error:', createError);
      return NextResponse.json(
        { error: `Failed to create admin user: ${createError.message}` },
        { status: 400 }
      );
    }

    if (!userData.user) {
      return NextResponse.json(
        { error: 'No user data returned from auth creation' },
        { status: 400 }
      );
    }

    // Create admin profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userData.user.id,
        username: ADMIN_CONFIG.username,
        display_name: ADMIN_CONFIG.display_name,
        bio: ADMIN_CONFIG.bio,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Admin profile creation error:', profileError);
      return NextResponse.json(
        { error: `Failed to create admin profile: ${profileError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: {
        id: userData.user.id,
        email: userData.user.email
      },
      profile: profileData,
      credentials: {
        email: ADMIN_CONFIG.email,
        password: ADMIN_CONFIG.password,
        username: `@${ADMIN_CONFIG.username}`
      }
    });

  } catch (error) {
    console.error('Admin seeding error:', error);
    return NextResponse.json(
      { error: 'Internal server error during admin seeding' },
      { status: 500 }
    );
  }
}