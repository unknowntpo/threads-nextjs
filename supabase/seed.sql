-- Seed data for local development
-- This file creates test users in auth.users, then profiles and posts

-- First, insert test users into auth.users (local development only)
-- Password hash is for 'password123' (bcrypt)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'alice@example.com',
    '$2a$10$ZjrKEW5fKKxqiYKfKqN3P.vqxJV1V5MXqKqN3P.vqxJV1V5MXqKqN3',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    'authenticated',
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'bob@example.com',
    '$2a$10$ZjrKEW5fKKxqiYKfKqN3P.vqxJV1V5MXqKqN3P.vqxJV1V5MXqKqN3',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    'authenticated',
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'charlie@example.com',
    '$2a$10$ZjrKEW5fKKxqiYKfKqN3P.vqxJV1V5MXqKqN3P.vqxJV1V5MXqKqN3',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    'authenticated',
    'authenticated'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding identities for email auth
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"alice@example.com"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '{"sub":"00000000-0000-0000-0000-000000000002","email":"bob@example.com"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '{"sub":"00000000-0000-0000-0000-000000000003","email":"charlie@example.com"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Now insert profiles (these will work because auth.users entries exist)
INSERT INTO public.profiles (id, username, display_name, bio, avatar_url)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'alice', 'Alice Cooper', 'Software engineer and coffee enthusiast ☕', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'bob', 'Bob Smith', 'Tech blogger | Photographer 📸', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'charlie', 'Charlie Brown', 'UI/UX Designer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie')
ON CONFLICT (id) DO NOTHING;

-- Insert sample posts
INSERT INTO public.posts (user_id, content, image_url)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Just deployed my first Next.js app with Supabase! 🚀', NULL),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Working on a new feature for the threads clone. Loving the Supabase developer experience!', NULL),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'Beautiful sunset today 🌅', 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=800'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'New blog post: "Getting Started with Supabase Local Development"', NULL),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'Just finished redesigning the profile page. What do you think?', NULL),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'Coffee first, design later ☕', NULL)
ON CONFLICT DO NOTHING;
