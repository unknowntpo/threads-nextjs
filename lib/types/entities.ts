import type { Database } from '@/lib/types/supabase'

// Entity types - Row types from database
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Post = Database['public']['Tables']['posts']['Row']

// Insert types - For creating new records
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type PostInsert = Database['public']['Tables']['posts']['Insert']

// Update types - For updating existing records
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type PostUpdate = Database['public']['Tables']['posts']['Update']

// Extended types with relations
export type PostWithProfile = Post & {
  profiles: Profile
}

// Request/Response DTOs
export interface CreateProfileDTO {
  username: string
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
}

export interface UpdateProfileDTO {
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
}

export interface CreatePostDTO {
  content: string
  image_url?: string | null
}

export interface UpdatePostDTO {
  content?: string
  image_url?: string | null
}
