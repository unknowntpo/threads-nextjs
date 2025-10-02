import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/supabase'
import type { Profile, ProfileInsert, ProfileUpdate } from '@/lib/types/entities'

export class ProfileRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async findByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  }

  async create(profile: ProfileInsert): Promise<Profile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, updates: ProfileUpdate): Promise<Profile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
