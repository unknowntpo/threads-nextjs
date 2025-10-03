import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SECRET_KEY is required for tests')
}

// Admin client for test setup/teardown
export const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Clean up all test data from the database
 * Uses TRUNCATE for speed - runs in test environment only
 */
export async function cleanupDatabase() {
    await adminClient.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    const { data: users } = await adminClient.auth.admin.listUsers()
    if (users?.users) {
      for (const user of users.users) {
        await adminClient.auth.admin.deleteUser(user.id)
      }
    }
}

/**
 * Create a test user with profile
 */
export async function createTestUser(data: {
  email: string
  password: string
  username: string
  display_name?: string
}) {
  // Create auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    throw new Error(`Failed to create test user: ${authError?.message}`)
  }

  // Create profile
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id: authData.user.id,
      username: data.username,
      display_name: data.display_name || data.username,
    })

  if (profileError) {
    throw new Error(`Failed to create test profile: ${profileError.message}`)
  }

  return authData.user
}
