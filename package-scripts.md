# Development Scripts

## Admin User Seeding

To create an admin user for testing, you need:

1. **Service Role Key** from Supabase:
   - Go to your Supabase project settings
   - Navigate to API > Project API keys
   - Copy the `service_role` key (not the anon key)

2. **Add to .env.local**:
   ```bash
   # Add this to your .env.local file
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. **Run the seeding via API**:
   ```bash
   # Start your Next.js dev server first
   pnpm run dev

   # In another terminal, seed the admin user
   pnpm run seed:admin
   
   # Or use curl directly
   curl -X POST http://localhost:3000/api/admin/seed
   ```

## Admin Credentials

After running the script, you'll have:
- **Email**: `admin@threads.local`
- **Password**: `admin123456` 
- **Username**: `@admin`

## Security Notes

- **Change the password** in production
- **Use environment variables** for sensitive data
- The service role key has **full database access** - keep it secure
- Only run seeding scripts in development/staging environments

## Testing Flow

With the admin user, you can test:
1. Login with admin credentials
2. Profile completion flow
3. Full authentication cycle
4. Database operations
5. API endpoints