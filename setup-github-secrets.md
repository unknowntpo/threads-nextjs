# GitHub Secrets Setup for CI/CD Deployment

## Required Secrets

Add these secrets to your GitHub repository:
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Zeabur Configuration

```
ZEABUR_TOKEN=<your-token-from-zeabur-auth-status>
ZEABUR_PROJECT_ID=682fe22e75f92a6870540c4f
ZEABUR_SERVICE_ID=68dce4ce4257ef9b300a6310
```

### Database & Auth (Production)

```
DATABASE_URL=<your-production-postgres-url>
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://threads-supabase-4j8bfk.zeabur.app
```

### OAuth Providers (Optional - can add later)

```
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
GITHUB_CLIENT_ID=<from-github-oauth-app>
GITHUB_CLIENT_SECRET=<from-github-oauth-app>
```

## Steps to Deploy

1. **Get Zeabur Token:**

   ```bash
   zeabur auth status
   ```

2. **Generate NextAuth Secret:**

   ```bash
   openssl rand -base64 32
   ```

3. **Add all secrets to GitHub**

4. **Trigger deployment:**
   - Push to `master` branch, OR
   - Go to Actions → "Deploy to Zeabur" → "Run workflow"

## Workflow File

The deployment workflow is at: `.github/workflows/deploy.yml`
