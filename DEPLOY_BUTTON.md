# One-Click Deploy to Zeabur

This repository includes a Zeabur template configuration for easy one-click deployment.

## Deploy Button

[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/YOUR_TEMPLATE_ID)

## What Gets Deployed

When you click the deploy button:

1. **PostgreSQL Database** - Zeabur-managed PostgreSQL instance
2. **Next.js Application** - Your Threads app deployed from GitHub
3. **Automatic Setup**:
   - Database migrations run automatically
   - Database seeding (optional)
   - Environment variables configured

## Configuration Required

During deployment, you'll be prompted for:

### Required

- **NEXTAUTH_SECRET** - Generate with `openssl rand -base64 32`

### Optional (for OAuth)

- **GOOGLE_CLIENT_ID** - For Google sign-in
- **GOOGLE_CLIENT_SECRET** - For Google sign-in
- **GITHUB_CLIENT_ID** - For GitHub sign-in
- **GITHUB_CLIENT_SECRET** - For GitHub sign-in

## Post-Deployment Steps

1. **Wait for deployment** (~2-3 minutes)
2. **Get your app URL** from Zeabur dashboard
3. **Configure OAuth redirect URIs** (if using OAuth):
   - Google: `https://your-app.zeabur.app/api/auth/callback/google`
   - GitHub: `https://your-app.zeabur.app/api/auth/callback/github`
4. **Verify deployment**:
   - Visit your app
   - Sign up for an account
   - Create a test post

## Template Features

✅ **Automated Setup**

- PostgreSQL database provisioned
- Prisma migrations applied automatically
- Database seeded with initial data
- All environment variables configured

✅ **Production Ready**

- Next.js 15 with Turbopack
- NextAuth v5 authentication
- Prisma ORM with PostgreSQL
- Full E2E test coverage

✅ **Zero Configuration**

- Build settings auto-detected
- Environment variables auto-configured
- Health checks enabled
- Auto-scaling enabled

## Manual Deployment Alternative

If you prefer manual deployment, follow our comprehensive guides:

- 📚 [Detailed Deployment Guide](./docs/DEPLOYMENT.md)
- ⚡ [Quick Start Guide](./docs/ZEABUR_QUICK_START.md)

## Template Configuration

The deployment is configured via:

- `zeabur.yaml` - Service definitions and environment setup
- `zbpack.json` - Build and start commands

## Troubleshooting

If deployment fails:

1. **Check Zeabur logs** in the dashboard
2. **Verify environment variables** are set correctly
3. **Ensure OAuth credentials** are valid (if using)
4. **Review migration logs** for database issues

For detailed troubleshooting, see [DEPLOYMENT.md](./docs/DEPLOYMENT.md#troubleshooting)

## Support

- 📖 [Zeabur Documentation](https://zeabur.com/docs)
- 💬 [GitHub Issues](https://github.com/unknowntpo/threads_supabase/issues)
- 🎮 [Zeabur Discord](https://discord.gg/zeabur)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
