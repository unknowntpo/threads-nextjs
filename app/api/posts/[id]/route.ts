import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import type { UpdatePost } from "@/lib/types/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    logger.apiRequest('GET', `/api/posts/${id}`);
    
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      logger.apiError('GET', `/api/posts/${id}`, 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch specific post with profile information
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      logger.apiError('GET', `/api/posts/${id}`, error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const duration = Date.now() - startTime;
    logger.apiSuccess('GET', `/api/posts/${id}`, duration, user.id);

    return NextResponse.json({ post });

  } catch (error) {
    const { id } = await params;
    logger.apiError('GET', `/api/posts/${id}`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    const body: UpdatePost = await request.json();
    logger.apiRequest('PUT', `/api/posts/${id}`);

    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      logger.apiError('PUT', `/api/posts/${id}`, 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the post (RLS will ensure user can only update their own posts)
    const { data: post, error } = await supabase
      .from('posts')
      .update({
        ...(body.content && { content: body.content.trim() }),
        ...(body.image_url !== undefined && { image_url: body.image_url }),
      })
      .eq('id', id)
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
      logger.apiError('PUT', `/api/posts/${id}`, error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const duration = Date.now() - startTime;
    logger.apiSuccess('PUT', `/api/posts/${id}`, duration, user.id);

    return NextResponse.json({ post });

  } catch (error) {
    const { id } = await params;
    logger.apiError('PUT', `/api/posts/${id}`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    logger.apiRequest('DELETE', `/api/posts/${id}`);

    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      logger.apiError('DELETE', `/api/posts/${id}`, 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the post (RLS will ensure user can only delete their own posts)
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      logger.apiError('DELETE', `/api/posts/${id}`, error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const duration = Date.now() - startTime;
    logger.apiSuccess('DELETE', `/api/posts/${id}`, duration, user.id);

    return NextResponse.json({ message: 'Post deleted successfully' });

  } catch (error) {
    const { id } = await params;
    logger.apiError('DELETE', `/api/posts/${id}`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}