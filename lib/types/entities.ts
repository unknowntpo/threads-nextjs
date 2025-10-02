/**
 * Domain entities - Extracted from database schema
 *
 * These types are derived from the auto-generated Supabase types.
 * Single source of truth: lib/types/supabase.ts (generated from DB schema)
 *
 * To regenerate: supabase gen types typescript --local > lib/types/supabase.ts
 */

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

// Request/Response DTOs for API routes
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

// Auth DTOs
export interface SignUpRequest {
  email: string
  password: string
  username: string
  display_name?: string
}

export interface SignInRequest {
  email: string
  password: string
}
