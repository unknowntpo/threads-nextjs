/**
 * Type validation - Ensures our entities match the database schema
 * This file has no runtime code, only compile-time type checks
 */

import type { Database } from '@/lib/types/supabase'
import type { Profile, Post, ProfileInsert, PostInsert } from '@/lib/types/entities'

// Validate that our entities are compatible with database types
type DbProfile = Database['public']['Tables']['profiles']['Row']
type DbPost = Database['public']['Tables']['posts']['Row']
type DbProfileInsert = Database['public']['Tables']['profiles']['Insert']
type DbPostInsert = Database['public']['Tables']['posts']['Insert']

// These type assertions will fail at compile time if entities drift from schema
const _profileValidation: Profile = {} as DbProfile
const _postValidation: Post = {} as DbPost
const _profileInsertValidation: ProfileInsert = {} as DbProfileInsert
const _postInsertValidation: PostInsert = {} as DbPostInsert

// Reverse validation - database types should also match our entities
const _dbProfileValidation: DbProfile = {} as Profile
const _dbPostValidation: DbPost = {} as Post

export {}
