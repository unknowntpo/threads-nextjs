#!/bin/bash
#
# Setup Terraform Secrets from GitHub
#
# Fetches all secrets from GitHub and generates terraform.tfvars
# This keeps secrets centrally managed in GitHub, not in local files.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"

echo "🔐 Fetching secrets from GitHub..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ Error: gh CLI not found. Install with: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Error: Not authenticated with GitHub. Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"

# Fetch secrets from GitHub
echo "📥 Fetching secrets..."

TF_STATE_BUCKET=$(gh secret list --json name,updatedAt | jq -r '.[] | select(.name=="TF_STATE_BUCKET") | .name' 2>/dev/null)
GCP_PROJECT_ID=$(gh secret list --json name,updatedAt | jq -r '.[] | select(.name=="GCP_PROJECT_ID") | .name' 2>/dev/null)
POSTGRES_PASSWORD=$(gh secret list --json name,updatedAt | jq -r '.[] | select(.name=="POSTGRES_PASSWORD") | .name' 2>/dev/null)
DAGSTER_POSTGRES_PASSWORD=$(gh secret list --json name,updatedAt | jq -r '.[] | select(.name=="DAGSTER_POSTGRES_PASSWORD") | .name' 2>/dev/null)
NEXTAUTH_SECRET=$(gh secret list --json name,updatedAt | jq -r '.[] | select(.name=="NEXTAUTH_SECRET") | .name' 2>/dev/null)
GOOGLE_CLIENT_SECRET=$(gh secret list --json name,updatedAt | jq -r '.[] | select(.name=="GOOGLE_CLIENT_SECRET") | .name' 2>/dev/null)

# Verify critical secrets exist
if [ -z "$TF_STATE_BUCKET" ] || [ -z "$GCP_PROJECT_ID" ] || [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ Error: Missing critical GitHub secrets!"
    echo "   Required: TF_STATE_BUCKET, GCP_PROJECT_ID, POSTGRES_PASSWORD"
    echo "   Run: gh secret list"
    exit 1
fi

echo "✅ All critical secrets found"

# Note: We can't actually retrieve secret values via gh CLI for security
# Users must set them manually in terraform.tfvars or use GitHub Actions
echo ""
echo "⚠️  IMPORTANT: GitHub Secrets are write-only for security."
echo "   To use secrets locally, you have two options:"
echo ""
echo "   Option 1: Manual (for local development)"
echo "     Copy terraform/terraform.tfvars.example to terraform/terraform.tfvars"
echo "     Fill in the values manually (they're already generated)"
echo ""
echo "   Option 2: GitHub Actions (recommended for deployment)"
echo "     Secrets are automatically injected in CI/CD pipeline"
echo "     No local terraform.tfvars needed"
echo ""
echo "📋 Configured GitHub Secrets:"
echo "   ✅ TF_STATE_BUCKET (bucket name with random suffix)"
echo "   ✅ GCP_PROJECT_ID"
echo "   ✅ POSTGRES_PASSWORD"
echo "   ✅ DAGSTER_POSTGRES_PASSWORD"
echo "   ✅ NEXTAUTH_SECRET"
echo "   ✅ GOOGLE_CLIENT_SECRET"
echo ""
echo "❌ Still needed in GitHub Secrets:"
echo "   - GOOGLE_CLIENT_ID"
echo "   - GITHUB_CLIENT_ID"
echo "   - GITHUB_CLIENT_SECRET"
echo "   - NEXTAUTH_URL (after first deployment)"
echo ""
echo "To add missing secrets:"
echo "  echo 'your-value' | gh secret set SECRET_NAME"
echo ""
