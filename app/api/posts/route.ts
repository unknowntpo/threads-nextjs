import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import type { CreatePost } from "@/lib/types/database";

export async function GET() {
  const startTime = Date.now();
  
  try {
    logger.apiRequest('GET', '/api/posts');
    
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      logger.apiError('GET', '/api/posts', 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch posts with profile information, ordered by creation date (newest first)
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (
          username,
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.apiError('GET', '/api/posts', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const duration = Date.now() - startTime;
    logger.apiSuccess('GET', '/api/posts', duration, user.id);

    return NextResponse.json({ posts: posts || [] });

  } catch (error) {
    logger.apiError('GET', '/api/posts', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: CreatePost = await request.json();
    logger.apiRequest('POST', '/api/posts');

    // Validate required fields
    if (!body.content?.trim()) {
      logger.apiError('POST', '/api/posts', 'Content is required');
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      logger.apiError('POST', '/api/posts', 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create the post
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: body.content.trim(),
        image_url: body.image_url || null,
      })
      .select(`
        *,
        profiles (
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      logger.apiError('POST', '/api/posts', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const duration = Date.now() - startTime;
    logger.apiSuccess('POST', '/api/posts', duration, user.id);

    return NextResponse.json({ post }, { status: 201 });

  } catch (error) {
    logger.apiError('POST', '/api/posts', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}