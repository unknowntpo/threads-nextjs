# Zeabur Deployment - Quick Start Checklist

## Pre-Deployment Checklist

- [ ] Generate NextAuth secret: `openssl rand -base64 32`
- [ ] Prepare OAuth credentials (Google, GitHub) for production URLs
- [ ] All tests passing locally: `pnpm test:e2e`
- [ ] Latest code pushed to `master` branch

## Deployment Steps

### 1. Create Zeabur Project (2 min)

```
1. Visit https://zeabur.com
2. Click "Create Project"
3. Name: "threads-app"
4. Select region (closest to users)
```

### 2. Add PostgreSQL Service (1 min)

```
1. Click "Add Service"
2. Select "PostgreSQL"
3. Wait for provisioning
4. Note the connection string
```

### 3. Deploy Next.js App (3 min)

```
1. Click "Add Service"
2. Select "Git"
3. Connect GitHub
4. Select repository: unknowntpo/threads_supabase
5. Branch: master
6. Auto-detected: Next.js
```

### 4. Set Environment Variables (2 min)

```
Required:
✓ DATABASE_URL = ${POSTGRES_URL}
✓ NEXTAUTH_SECRET = <your-generated-secret>
✓ NEXTAUTH_URL = https://your-app.zeabur.app
✓ NODE_ENV = production

Optional (for OAuth):
○ GOOGLE_CLIENT_ID
○ GOOGLE_CLIENT_SECRET
○ GITHUB_CLIENT_ID
○ GITHUB_CLIENT_SECRET
```

### 5. Run Migrations (1 min)

```bash
# In Zeabur Console:
npx prisma migrate deploy
npx prisma db seed  # Optional
```

### 6. Verify Deployment (2 min)

```
□ Visit https://your-app.zeabur.app
□ Sign up new account
□ Login
□ Create a post
□ View feed
□ Sign out
```

## Total Time: ~10-15 minutes

## Quick Commands

```bash
# Generate secret
openssl rand -base64 32

# Run migrations (in Zeabur console)
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed

# Check migration status
npx prisma migrate status

# View logs
# Use Zeabur web console → Logs tab
```

## Common Issues & Quick Fixes

**Build Failed?**

- Check Zeabur logs for errors
- Verify all env vars are set
- Try rebuilding

**Can't connect to database?**

- Ensure `DATABASE_URL = ${POSTGRES_URL}`
- Check PostgreSQL service is running
- Restart both services

**OAuth not working?**

- Update OAuth app redirect URLs
- Format: `https://your-app.zeabur.app/api/auth/callback/<provider>`
- Verify `NEXTAUTH_URL` is correct

**Migrations failed?**

- Check database is empty or has correct schema
- Run `npx prisma migrate status` to check
- May need to reset: `npx prisma migrate reset`

## Zeabur URLs

- **Dashboard**: https://dash.zeabur.com
- **Documentation**: https://zeabur.com/docs
- **Discord Support**: https://discord.gg/zeabur

## Post-Deployment

- [ ] Update issue #11 with deployment URL
- [ ] Test all features in production
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring (optional)
- [ ] Update README with production URL

---

For detailed deployment guide, see [DEPLOYMENT.md](./DEPLOYMENT.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
