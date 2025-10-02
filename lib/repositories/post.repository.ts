import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/supabase'
import type { Post, PostInsert, PostUpdate, PostWithProfile } from '@/lib/types/entities'

export class PostRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Post | null> {
    const { data, error } = await this.supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  }

  async findByIdWithProfile(id: string): Promise<PostWithProfile | null> {
    const { data, error } = await this.supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as PostWithProfile
  }

  async findAll(limit = 50, offset = 0): Promise<PostWithProfile[]> {
    const { data, error } = await this.supabase
      .from('posts')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data as PostWithProfile[]
  }

  async findByUserId(userId: string, limit = 50): Promise<Post[]> {
    const { data, error } = await this.supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  async create(post: PostInsert): Promise<Post> {
    const { data, error } = await this.supabase
      .from('posts')
      .insert(post)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, updates: PostUpdate): Promise<Post> {
    const { data, error } = await this.supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
