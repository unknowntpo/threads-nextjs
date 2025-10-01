# MVP 1 Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New project"
3. Fill in project details:
   - Name: `threads-clone`
   - Database password: (save this somewhere secure)
   - Region: Choose closest to you
4. Click "Create new project"
5. Wait for project to be ready (~2 minutes)

## Step 2: Get API Keys

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following:
   - **Project URL**
   - **anon/public key**

## Step 3: Configure Environment

1. Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-key-here
   ```

## Step 4: Set up Database with CLI

1. Install Supabase CLI:
   ```bash
   pnpm add -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Initialize Supabase in your project:
   ```bash
   supabase init
   ```

4. Link to your remote project:
   ```bash
   supabase link --project-ref your-project-id
   ```
   (Get project-id from your Supabase URL: `https://your-project-id.supabase.co`)

5. Run the migration:
   ```bash
   supabase db push
   ```

6. Verify the `profiles` table was created in **Table Editor** on dashboard

## Step 5: Create Admin User (Optional)

1. Get your service role key from Supabase:
   - Go to Settings > API in your Supabase dashboard
   - Copy the `service_role` key (not anon key)

2. Add to `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. Start the development server:
   ```bash
   pnpm run dev
   ```

4. In another terminal, run the seeding:
   ```bash
   pnpm run seed:admin
   ```

5. Admin credentials will be:
   - Email: `admin@threads.local`
   - Password: `admin123456`
   - Username: `@admin`

## Step 6: Test the App

1. Start the development server:
   ```bash
   pnpm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000)
3. Test the authentication flow:
   - Sign in with admin credentials OR
   - Sign up with a new account
   - Complete profile setup if needed
   - Verify the protected dashboard works

## Next Steps

Once authentication is working, we'll:
1. Customize the auth pages
2. Create a profile setup form
3. Add basic navigation

## Troubleshooting

- **Email confirmation required**: Check your Supabase project settings > Authentication > Settings to disable email confirmation for development
- **RLS errors**: Ensure the migration ran successfully and policies are created
- **Environment variables**: Make sure `.env.local` has the correct values from your Supabase project