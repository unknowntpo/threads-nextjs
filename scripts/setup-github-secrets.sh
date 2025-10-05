#!/bin/bash

# Setup GitHub Secrets for Zeabur Deployment
# This script helps you configure all required secrets using GitHub CLI

set -e

echo "🔐 GitHub Secrets Setup for Zeabur Deployment"
echo "=============================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ You are not authenticated with GitHub CLI."
    echo "   Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Helper function to set secret
set_secret() {
    local name=$1
    local description=$2
    local required=$3

    echo "📝 $description"

    # Check if secret already exists
    if gh secret list | grep -q "^$name"; then
        read -p "   Secret '$name' already exists. Update it? (y/N): " update
        if [[ ! $update =~ ^[Yy]$ ]]; then
            echo "   ⏭️  Skipped"
            echo ""
            return
        fi
    fi

    if [[ $required == "required" ]]; then
        read -sp "   Enter value for $name (required): " value
        echo ""

        if [[ -z "$value" ]]; then
            echo "   ❌ Error: Value cannot be empty for required secret"
            exit 1
        fi
    else
        read -sp "   Enter value for $name (optional, press Enter to skip): " value
        echo ""

        if [[ -z "$value" ]]; then
            echo "   ⏭️  Skipped (optional)"
            echo ""
            return
        fi
    fi

    echo "$value" | gh secret set "$name"
    echo "   ✅ Secret '$name' set successfully"
    echo ""
}

# Generate NextAuth secret helper
generate_nextauth_secret() {
    if command -v openssl &> /dev/null; then
        openssl rand -base64 32
    else
        echo "$(date +%s)$(head -c 16 /dev/urandom | base64)" | sha256sum | cut -d' ' -f1
    fi
}

echo "Setting up required secrets..."
echo ""

# Zeabur Authentication
echo "📍 1. Zeabur Authentication Secrets"
echo "   Get these from: https://dash.zeabur.com"
echo ""

set_secret "ZEABUR_TOKEN" "Zeabur API Token (Settings → Developer → Generate Token)" "required"
set_secret "ZEABUR_PROJECT_ID" "Zeabur Project ID (from project URL)" "required"
set_secret "ZEABUR_SERVICE_ID" "Zeabur Service ID (from service URL)" "required"

# Database
echo "📍 2. Database Configuration"
echo ""

set_secret "DATABASE_URL" "PostgreSQL Connection String (from Zeabur PostgreSQL service)" "required"

# NextAuth
echo "📍 3. NextAuth Configuration"
echo ""

# Offer to generate NextAuth secret
read -p "   Generate NextAuth secret automatically? (Y/n): " auto_gen
if [[ ! $auto_gen =~ ^[Nn]$ ]]; then
    generated_secret=$(generate_nextauth_secret)
    echo "$generated_secret" | gh secret set "NEXTAUTH_SECRET"
    echo "   ✅ Generated and set NEXTAUTH_SECRET"
    echo "   📋 Your secret: $generated_secret"
    echo "   💡 Save this somewhere safe!"
else
    set_secret "NEXTAUTH_SECRET" "NextAuth Secret (generate with: openssl rand -base64 32)" "required"
fi
echo ""

set_secret "NEXTAUTH_URL" "NextAuth URL (e.g., https://your-app.zeabur.app)" "required"

# Optional OAuth
echo "📍 4. OAuth Providers (Optional)"
echo "   Skip these if you're not using OAuth"
echo ""

set_secret "GOOGLE_CLIENT_ID" "Google OAuth Client ID" "optional"
set_secret "GOOGLE_CLIENT_SECRET" "Google OAuth Client Secret" "optional"
set_secret "GITHUB_CLIENT_ID" "GitHub OAuth Client ID" "optional"
set_secret "GITHUB_CLIENT_SECRET" "GitHub OAuth Client Secret" "optional"

# Summary
echo "=============================================="
echo "✅ GitHub Secrets Setup Complete!"
echo ""
echo "📋 Secrets configured:"
gh secret list
echo ""
echo "📝 Next steps:"
echo "1. Verify all secrets are set correctly"
echo "2. Set the same environment variables in Zeabur dashboard"
echo "3. Push to master branch to trigger deployment"
echo ""
echo "📚 Documentation:"
echo "   - Secrets guide: docs/GITHUB_SECRETS_SETUP.md"
echo "   - Deployment guide: docs/DEPLOYMENT.md"
echo ""
echo "🚀 Ready to deploy!"
