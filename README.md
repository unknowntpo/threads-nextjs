# Threads - Social Media Application

<p align="center">
  <img src=".zeabur/icon.png" width="120" height="120" alt="Threads Logo">
</p>

<p align="center">
  A modern social media platform built with Next.js 15, Prisma, PostgreSQL, and NextAuth v5
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#quick-deploy"><strong>Deploy</strong></a> ·
  <a href="#local-development"><strong>Local Dev</strong></a> ·
  <a href="#documentation"><strong>Docs</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
</p>

---

## ⚡ Quick Deploy

Deploy to Zeabur with one click:

[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/YOUR_TEMPLATE_ID)

Or follow our [deployment guide](./docs/DEPLOYMENT.md).

## ✨ Features

- 🔐 **Authentication** - NextAuth v5 with multiple providers:
  - Email/Password
  - Google OAuth
  - GitHub OAuth
- 📝 **Posts** - Create, read, and share posts with media
- 🔄 **Real-time Feed** - Dynamic post feed with user interactions
- 👤 **User Profiles** - Display names, usernames, avatars
- 💾 **PostgreSQL Database** - Type-safe queries with Prisma ORM
- 🎨 **Modern UI** - Built with Tailwind CSS and shadcn/ui
- ✅ **Full Test Coverage** - E2E tests with Playwright
- 🚀 **Production Ready** - CI/CD pipeline with GitHub Actions

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **Turbopack** - Fast bundler and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Re-usable component library

### Backend

- **Prisma** - Type-safe ORM
- **PostgreSQL** - Relational database
- **NextAuth v5** - Authentication
- **Next.js API Routes** - Serverless functions

### DevOps

- **Docker Compose** - Local development
- **GitHub Actions** - CI/CD pipeline
- **Playwright** - E2E testing
- **Vitest** - Unit testing
- **ESLint + Prettier** - Code quality

## 📦 Quick Start

### Prerequisites

- Node.js 20+ and pnpm
- Docker and Docker Compose (for local database)
- Git

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/unknowntpo/threads_supabase.git
   cd threads_supabase
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration.

4. **Start services**

   ```bash
   docker-compose up -d  # PostgreSQL + Keycloak
   ```

5. **Run migrations**

   ```bash
   pnpm prisma:migrate
   pnpm db:seed
   ```

6. **Start development server**

   ```bash
   pnpm dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env.local` with:

```bash
# Database
DATABASE_URL="postgresql://threads_user:threads_password@localhost:5432/threads_db"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"  # Generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

## 🧪 Testing

### Run all tests

```bash
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests
pnpm test:all      # All tests
```

### E2E tests with UI

```bash
pnpm test:e2e:ui
```

## 📚 Documentation

- 📘 [Deployment Guide](./docs/DEPLOYMENT.md) - Complete deployment instructions
- ⚡ [Quick Start](./docs/ZEABUR_QUICK_START.md) - 10-minute deployment
- 🚀 [Deploy Button Guide](./DEPLOY_BUTTON.md) - One-click deployment

## 🏗️ Project Structure

```
threads_supabase/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── feed/              # Feed page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
├── lib/                   # Utilities and configs
│   ├── repositories/     # Data access layer
│   └── types/            # TypeScript types
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Prisma schema
│   ├── migrations/       # Migration history
│   └── seed.ts          # Database seeding
├── e2e/                  # E2E tests
├── docs/                 # Documentation
└── docker-compose.yml    # Local services
```

## 🚢 Deployment

### Zeabur (Recommended)

**One-Click Deploy:**
[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/YOUR_TEMPLATE_ID)

**Manual Deploy:**
Follow our [Zeabur deployment guide](./docs/DEPLOYMENT.md)

### Other Platforms

The application can be deployed to:

- Vercel (with external PostgreSQL)
- Railway
- Render
- Fly.io
- Any Docker-compatible platform

See [deployment documentation](./docs/DEPLOYMENT.md) for platform-specific guides.

## 🔧 Development Commands

```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm prisma:generate  # Generate Prisma Client
pnpm prisma:migrate   # Run migrations
pnpm prisma:studio    # Open Prisma Studio
pnpm db:seed          # Seed database
pnpm db:reset         # Reset database

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm format           # Format with Prettier
pnpm typecheck        # TypeScript type checking

# Testing
pnpm test             # Run unit tests
pnpm test:watch       # Run unit tests in watch mode
pnpm test:e2e         # Run E2E tests
pnpm test:e2e:ui      # Run E2E tests with UI

# Docker
docker-compose up -d  # Start services
docker-compose down   # Stop services
docker-compose logs   # View logs
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Zeabur](https://zeabur.com/) - Deployment platform

## 📧 Support

- 🐛 [Report a Bug](https://github.com/unknowntpo/threads_supabase/issues/new?labels=bug)
- 💡 [Request a Feature](https://github.com/unknowntpo/threads_supabase/issues/new?labels=enhancement)
- 💬 [GitHub Discussions](https://github.com/unknowntpo/threads_supabase/discussions)

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/unknowntpo">unknowntpo</a>
</p>

<p align="center">
  <sub>🤖 Generated with <a href="https://claude.com/claude-code">Claude Code</a></sub>
</p>
