// Domain entities - Database-agnostic

export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string | null
  updated_at: string | null
}

export interface Post {
  id: string
  user_id: string
  content: string
  image_url: string | null
  created_at: string
  updated_at: string
}

// Insert types - Derived from entities
export type ProfileInsert = Pick<Profile, 'id' | 'username'> & {
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type PostInsert = Pick<Post, 'user_id' | 'content'> & {
  image_url?: string | null
  created_at?: string
  updated_at?: string
}

// Update types - Derived from entities (all fields optional except id)
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>> & {
  updated_at?: string | null
}

export type PostUpdate = Partial<Omit<Post, 'id' | 'user_id' | 'created_at'>> & {
  updated_at?: string
}

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
