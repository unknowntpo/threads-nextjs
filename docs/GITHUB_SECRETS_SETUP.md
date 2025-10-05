# GitHub Secrets Setup for Zeabur Deployment

This guide explains how to configure GitHub Secrets for automated deployment to Zeabur using GitHub Actions.

## Overview

The deployment workflow (`.github/workflows/deploy.yml`) requires several secrets to be configured in your GitHub repository settings.

## Quick Setup (Recommended)

Use the provided script to set up all secrets interactively:

```bash
./scripts/setup-github-secrets.sh
```

This script will:

- ✅ Guide you through each required secret
- ✅ Auto-generate NextAuth secret
- ✅ Validate required values
- ✅ Show you what's configured

**Prerequisites**: GitHub CLI (`gh`) installed and authenticated

Install GitHub CLI:

```bash
# macOS
brew install gh

# Linux
sudo apt install gh

# Windows
winget install GitHub.cli
```

Authenticate:

```bash
gh auth login
```

## Manual Setup

If you prefer to set secrets manually:

## Required GitHub Secrets

### 1. Zeabur Authentication

#### `ZEABUR_TOKEN`

Your Zeabur API token for authentication.

**How to get it:**

1. Go to https://dash.zeabur.com
2. Click on your profile → Settings
3. Navigate to "Developer" section
4. Click "Generate Token"
5. Copy the token (you won't see it again!)

**Add to GitHub:**

```
Settings → Secrets and variables → Actions → New repository secret
Name: ZEABUR_TOKEN
Value: <your-zeabur-token>
```

#### `ZEABUR_PROJECT_ID`

Your Zeabur project ID.

**How to get it:**

1. Go to your Zeabur project
2. Look at the URL: `https://dash.zeabur.com/projects/<PROJECT_ID>`
3. Copy the project ID from the URL

**Add to GitHub:**

```
Name: ZEABUR_PROJECT_ID
Value: <your-project-id>
```

#### `ZEABUR_SERVICE_ID`

Your Next.js service ID in Zeabur.

**How to get it:**

1. Go to your Zeabur project
2. Click on your Next.js service
3. Look at the URL: `https://dash.zeabur.com/projects/<PROJECT_ID>/services/<SERVICE_ID>`
4. Copy the service ID from the URL

**Add to GitHub:**

```
Name: ZEABUR_SERVICE_ID
Value: <your-service-id>
```

### 2. Application Environment Variables

These are the same environment variables used in production:

#### `DATABASE_URL`

PostgreSQL connection string from Zeabur.

**How to get it:**

1. Go to your Zeabur PostgreSQL service
2. Click "Connect" or "Environment"
3. Copy the connection string

**Format:**

```
postgresql://username:password@host:port/database
```

**Add to GitHub:**

```
Name: DATABASE_URL
Value: <your-database-url>
```

#### `NEXTAUTH_SECRET`

Secret key for NextAuth session encryption.

**How to generate:**

```bash
openssl rand -base64 32
```

**Add to GitHub:**

```
Name: NEXTAUTH_SECRET
Value: <your-generated-secret>
```

#### `NEXTAUTH_URL`

The canonical URL of your deployed application.

**Example:**

```
https://your-app.zeabur.app
```

**Add to GitHub:**

```
Name: NEXTAUTH_URL
Value: <your-app-url>
```

### 3. Optional OAuth Secrets

If you're using OAuth providers, add these:

#### `GOOGLE_CLIENT_ID` (Optional)

```
Name: GOOGLE_CLIENT_ID
Value: <your-google-client-id>
```

#### `GOOGLE_CLIENT_SECRET` (Optional)

```
Name: GOOGLE_CLIENT_SECRET
Value: <your-google-client-secret>
```

#### `GITHUB_CLIENT_ID` (Optional)

```
Name: GITHUB_CLIENT_ID
Value: <your-github-client-id>
```

#### `GITHUB_CLIENT_SECRET` (Optional)

```
Name: GITHUB_CLIENT_SECRET
Value: <your-github-client-secret>
```

## Step-by-Step Setup

### 1. Create Zeabur Project and Services

First, manually create your Zeabur project:

1. Go to https://zeabur.com
2. Create a new project
3. Add PostgreSQL service
4. Add Git service (connect your GitHub repo)
5. Note down the Project ID and Service ID

### 2. Configure GitHub Secrets

Go to your GitHub repository:

```
Settings → Secrets and variables → Actions → New repository secret
```

Add all required secrets:

- ✅ `ZEABUR_TOKEN`
- ✅ `ZEABUR_PROJECT_ID`
- ✅ `ZEABUR_SERVICE_ID`
- ✅ `DATABASE_URL`
- ✅ `NEXTAUTH_SECRET`
- ✅ `NEXTAUTH_URL`
- ⭕ `GOOGLE_CLIENT_ID` (optional)
- ⭕ `GOOGLE_CLIENT_SECRET` (optional)
- ⭕ `GITHUB_CLIENT_ID` (optional)
- ⭕ `GITHUB_CLIENT_SECRET` (optional)

### 3. Set Environment Variables in Zeabur

Also set the same environment variables in Zeabur:

1. Go to your Next.js service in Zeabur
2. Click "Variables" tab
3. Add all environment variables:

```env
DATABASE_URL=${POSTGRES_URL}
NEXTAUTH_SECRET=<same-as-github-secret>
NEXTAUTH_URL=<your-app-url>
NODE_ENV=production
# OAuth variables if using...
```

### 4. Test the Workflow

1. Push a commit to `master` branch
2. Go to Actions tab in GitHub
3. Watch the deployment workflow run
4. Verify deployment succeeded

## Workflow Triggers

The deployment workflow runs on:

1. **Push to master**: Automatic deployment
2. **Manual trigger**: Use "Run workflow" button in Actions tab

## Deployment Process

When triggered, the workflow:

1. ✅ Checks out code
2. ✅ Installs dependencies
3. ✅ Generates Prisma Client
4. ✅ Builds Next.js application
5. ✅ Deploys to Zeabur using CLI
6. ✅ Runs database migrations
7. ✅ Seeds database (optional)
8. ✅ Creates deployment summary

## Troubleshooting

### Authentication Failed

**Error**: "Invalid Zeabur token"

**Solution**:

- Regenerate token in Zeabur dashboard
- Update `ZEABUR_TOKEN` secret in GitHub

### Wrong Project/Service ID

**Error**: "Project not found" or "Service not found"

**Solution**:

- Double-check IDs from Zeabur dashboard URL
- Update `ZEABUR_PROJECT_ID` and `ZEABUR_SERVICE_ID`

### Migration Errors

**Error**: "Migration failed"

**Solution**:

1. Check `DATABASE_URL` is correct
2. Ensure PostgreSQL service is running
3. Run migrations manually in Zeabur console

### Build Failures

**Error**: "Build failed"

**Solution**:

1. Check all environment variables are set
2. Ensure `DATABASE_URL` is accessible during build
3. Review build logs in GitHub Actions

## Security Best Practices

1. **Never commit secrets to git**
   - Use `.env.local` for local development
   - Use GitHub Secrets for CI/CD
   - Use Zeabur Variables for production

2. **Rotate secrets regularly**
   - Regenerate `NEXTAUTH_SECRET` periodically
   - Update OAuth credentials when needed
   - Rotate Zeabur token annually

3. **Limit token permissions**
   - Use Zeabur token with minimal required permissions
   - Don't share tokens publicly

4. **Use different secrets for staging/production**
   - Separate GitHub secrets per environment
   - Use different databases per environment

## Verification Checklist

After setup, verify:

- [ ] All required secrets are added to GitHub
- [ ] Same environment variables are in Zeabur
- [ ] Workflow runs successfully on push to master
- [ ] Application is accessible at `NEXTAUTH_URL`
- [ ] Database migrations applied
- [ ] OAuth providers work (if configured)

## Alternative: Manual Deployment

If you prefer manual deployment:

1. Comment out the `deploy.yml` workflow
2. Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for manual steps
3. Use Zeabur dashboard for deployments

## Resources

- [Zeabur CLI Documentation](https://zeabur.com/docs/cli)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Zeabur Dashboard](https://dash.zeabur.com)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
