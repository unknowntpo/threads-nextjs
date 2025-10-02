-- Seed data for local development
-- This file creates test users and sample posts

-- Note: Users are created via Supabase Auth, so we need to insert into auth.users
-- For local testing, we'll create profiles assuming auth users exist

-- Insert test user profiles
-- These IDs should match test users you create via the Supabase Studio or signup flow
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
