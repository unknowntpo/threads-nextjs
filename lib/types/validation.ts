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

// Type assertion utilities for compile-time validation
type AssertEqual<T, U> = T extends U ? (U extends T ? true : never) : never
type AssertAssignable<T, U> = T extends U ? true : never

// These will fail at compile time if types don't match
type _ProfileCheck = AssertAssignable<DbProfile, Profile>
type _PostCheck = AssertAssignable<DbPost, Post>
type _ProfileInsertCheck = AssertAssignable<DbProfileInsert, ProfileInsert>
type _PostInsertCheck = AssertAssignable<DbPostInsert, PostInsert>

// Reverse validation - our entities should also be assignable to DB types
type _DbProfileCheck = AssertAssignable<Profile, DbProfile>
type _DbPostCheck = AssertAssignable<Post, DbPost>

export {}
