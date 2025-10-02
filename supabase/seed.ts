import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { CreateProfileDTO, CreatePostDTO } from '@/lib/types/entities'

interface SeedUser {
  email: string
  password: string
  profile: Omit<CreateProfileDTO, 'avatar_url'> & { avatar_url: string }
  posts: CreatePostDTO[]
}

// Load environment variables from .env.local
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
} catch (e) {
  // .env.local not found, use environment variables
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testUsers: SeedUser[] = [
  {
    email: 'alice@example.com',
    password: 'password123',
    profile: {
      username: 'alice',
      display_name: 'Alice Cooper',
      bio: 'Software engineer and coffee enthusiast ☕',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'
    },
    posts: [
      { content: 'Just deployed my first Next.js app with Supabase! 🚀' },
      { content: 'Working on a new feature for the threads clone. Loving the Supabase developer experience!' }
    ]
  },
  {
    email: 'bob@example.com',
    password: 'password123',
    profile: {
      username: 'bob',
      display_name: 'Bob Smith',
      bio: 'Tech blogger | Photographer 📸',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
    },
    posts: [
      { content: 'Beautiful sunset today 🌅', image_url: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=800' },
      { content: 'New blog post: "Getting Started with Supabase Local Development"' }
    ]
  },
  {
    email: 'charlie@example.com',
    password: 'password123',
    profile: {
      username: 'charlie',
      display_name: 'Charlie Brown',
      bio: 'UI/UX Designer',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie'
    },
    posts: [
      { content: 'Just finished redesigning the profile page. What do you think?' },
      { content: 'Coffee first, design later ☕' }
    ]
  }
]

async function seed() {
  console.log('Starting seed process...\n')

  for (const user of testUsers) {
    console.log(`Creating user: ${user.email}`)

    // Create user with admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      user_metadata: {},
      email: user.email,
      password: user.password,
      email_confirm: true
    })

    let userId: string
    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`  ⚠️  User already exists: ${user.email}`)
        // Get the existing user ID
        const { data: existingUser } = await supabase.auth.admin.listUsers()
        const foundUser = existingUser?.users.find(u => u.email === user.email)
        if (!foundUser) {
          console.error(`  ❌ Could not find existing user: ${user.email}`)
          continue
        }
        userId = foundUser.id
      } else {
        console.error(`  ❌ Error creating user: ${authError.message}`)
        continue
      }
    } else {
      if (!authUser.user?.id) {
        console.error(`  ❌ No user ID returned for: ${user.email}`)
        continue
      }
      userId = authUser.user.id
      console.log(`  ✅ User created: ${authUser.user.email}`)
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: user.profile.username,
        display_name: user.profile.display_name,
        bio: user.profile.bio,
        avatar_url: user.profile.avatar_url
      })

    if (profileError) {
      console.error(`  ❌ Error creating profile: ${profileError.message}`)
    } else {
      console.log(`  ✅ Profile created: @${user.profile.username}`)
    }

    // Create posts
    for (const post of user.posts) {
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: post.content,
          image_url: post.image_url
        })

      if (postError) {
        console.error(`  ❌ Error creating post: ${postError.message}`)
      } else {
        console.log(`  ✅ Post created`)
      }
    }

    console.log('')
  }

  console.log('Seed process complete! 🎉')
  console.log('\nTest credentials:')
  testUsers.forEach(user => {
    console.log(`  Email: ${user.email}, Password: ${user.password}`)
  })
}

seed().catch(console.error)
