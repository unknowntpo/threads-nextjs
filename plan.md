# Threads clone with Supabase backend

Reference: https://www.threads.com

## Arch

Framework:

- Next.js 15
- PostgreSQL
- Prisma ORM
- NextAuth (or custom JWT auth)

**Migration Note:** Originally built with Supabase, now migrating to plain PostgreSQL + Prisma for simpler development and better control. See Epic #15 for migration details.

## Database Schema

```sql
-- Users table (with built-in auth)
users (
  id: uuid PRIMARY KEY,
  email: varchar unique,
  password_hash: varchar,
  username: varchar unique,
  display_name: varchar,
  bio: text,
  avatar_url: text,
  created_at: timestamp,
  updated_at: timestamp
)

-- Posts table
posts (
  id: uuid PRIMARY KEY,
  user_id: uuid (FK users.id),
  content: text,
  media_urls: text[],
  created_at: timestamp,
  updated_at: timestamp
)

-- Follows relationship
follows (
  id: uuid PRIMARY KEY,
  follower_id: uuid (FK users.id),
  following_id: uuid (FK users.id),
  created_at: timestamp,
  UNIQUE(follower_id, following_id)
)

-- Likes
likes (
  id: uuid PRIMARY KEY,
  user_id: uuid (FK users.id),
  post_id: uuid (FK posts.id),
  created_at: timestamp,
  UNIQUE(user_id, post_id)
)

-- Comments
comments (
  id: uuid PRIMARY KEY,
  user_id: uuid (FK users.id),
  post_id: uuid (FK posts.id),
  content: text,
  created_at: timestamp,
  updated_at: timestamp
)

-- Notifications
notifications (
  id: uuid PRIMARY KEY,
  user_id: uuid (FK users.id),
  type: varchar, -- 'new_post', 'like', 'comment', 'follow'
  related_user_id: uuid (FK users.id),
  related_post_id: uuid (FK posts.id) NULL,
  read: boolean DEFAULT false,
  created_at: timestamp
)
```

## Features Implementation

### 1. Post Creation Feature

**Backend:**

- API Route: `POST /api/posts`
- Prisma queries for database operations
- WebSocket for real-time updates (optional, future enhancement)

**Frontend Components:**

- `PostComposer` - Text area with media upload
- `PostSubmissionState` - Loading/success/error states
- `MediaUploader` - Handle image/video uploads

**Technical Tasks:**

- Set up local file storage or S3 for media
- Implement authorization checks in API routes
- Create post creation API route with validation
- Build composer UI with rich text support
- Add optimistic UI updates

### 2. Timeline Feature

**Backend:**

- API Routes: `GET /api/timeline?cursor=&limit=20`
- Database: Join posts with user follows, cursor-based pagination
- Optimized indexes on (user_id, created_at)

**Frontend Components:**

- `Timeline` - Main timeline container
- `PostCard` - Individual post display
- `InfiniteScroll` - Pagination handler
- `TimelineLoader` - Loading states

**Technical Tasks:**

- Implement cursor-based pagination
- Create timeline query with proper joins
- Build infinite scroll with intersection observer
- Add loading skeletons and empty states
- Implement pull-to-refresh functionality
- Cache management with React Query/SWR

### 3. Post Interactions Feature

**Backend:**

- API Routes:
  - `POST/DELETE /api/posts/[id]/like`
  - `POST /api/posts/[id]/comments`
  - `GET /api/posts/[id]/comments?cursor=&limit=10`
- Functions: `toggle_like()`, `create_comment()`

**Frontend Components:**

- `InteractionBar` - Like, comment, share buttons
- `CommentsList` - Comments display with pagination
- `CommentComposer` - Comment input with @mentions
- `MentionAutocomplete` - User search/selection
- `FollowButton` - Follow/unfollow functionality

**Technical Tasks:**

- Implement optimistic like/unlike with rollback
- Build @mention system with autocomplete
- Create comment threading (if needed)
- Implement follow/unfollow with authorization checks
- User search and suggestion system

### 4. User Relationships Feature

**Backend:**

- API Routes:
  - `POST/DELETE /api/users/[id]/follow`
  - `GET /api/users/[id]/followers`
  - `GET /api/users/[id]/following`
- Database triggers for follower counts and notifications

**Frontend Components:**

- `UserProfile` - Profile page with follow status
- `FollowersList` - Followers/following lists
- `UserCard` - User display component
- `FollowSuggestions` - Discover new users

**Technical Tasks:**

- Implement follow/unfollow with proper authorization
- Build user discovery algorithm
- Create follower/following lists with pagination
- Add mutual follow indicators
- Implement follow suggestions
- Private/public account settings

## Technical Stack

**Frontend:**

- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui components (Radix UI + Tailwind)
- Client-side fetch for API calls
- No client state management (using server components)

**Backend:**

- Next.js API Routes (app/api/)
- PostgreSQL database
- Prisma ORM for type-safe database access
- NextAuth or custom JWT for authentication
- Local file storage or S3 for media
- Direct Prisma queries in API routes

**Architecture Pattern:**

- Server Components: fetch() API routes server-side for initial data
- Client Components: fetch() API routes client-side for mutations
- router.refresh() for data revalidation
- No Server Actions (following POC pattern)

## Development Phases (Incremental MVPs)

### MVP 1: Basic Auth & Profile Setup ✅

**Goal:** User can sign up, sign in, and set up profile
**Deliverable:** Working authentication flow with profile creation
**Database:** `profiles` table only
**Frontend:**

- [x] Login/signup pages
- [x] Profile setup form
- [x] Basic navigation
      **Test:** User can create account and edit profile

### MVP 2: Post Creation & Display ✅

**Goal:** User can create and view their own posts
**Deliverable:** Simple post composer and personal feed
**Database:** Add `posts` table
**Frontend:**

- [x] Post composer (text only)
- [x] Personal posts list
- [x] Basic post card display
      **Test:** User can write posts and see them listed

### MVP 3: Docker Image & CI/CD Setup ✅

**Goal:** Automate Docker image building with semantic versioning
**Deliverable:** GitHub Actions workflow that builds and tags Docker images
**Tasks:**

- [x] Create Dockerfile for Next.js app
- [x] Set up GitHub Actions workflow for Docker build
- [x] Implement semantic versioning (v1.0.0, v1.0.1, etc.)
- [x] Tag images with version, latest, and git SHA
- [x] Push images to GitHub Container Registry (ghcr.io)
- [x] Configure workflow triggers (push to main, tag creation)
- [x] Add build caching for faster builds
- [x] Test image locally before deployment
      **Test:** Git tag triggers automated Docker build with proper version tags

### MVP 4: PostgreSQL + Prisma Migration & DevOps Setup 🚧

**Goal:** Migrate to PostgreSQL + Prisma with complete development tooling and deployment
**Deliverable:** Live application on Zeabur with professional development workflow
**Epic:** See Issue #15 for detailed migration plan
**Services:**

- PostgreSQL (Docker Compose for local, Zeabur PostgreSQL for production)
- Prisma ORM
- Zeabur (Deployment platform)

**Phase 1: Database & Auth Migration**

- [ ] Set up PostgreSQL with Docker Compose locally
- [ ] Initialize Prisma with schema
- [ ] Migrate existing schema to Prisma
- [ ] Implement NextAuth or custom JWT auth
- [ ] Replace all Supabase client calls with Prisma
- [ ] Update middleware for new auth

**Phase 2: Development Tooling**

- [ ] Configure Prettier with project standards
- [ ] Configure ESLint with Next.js rules
- [ ] Set up Husky + lint-staged for pre-commit
- [ ] Add format/lint npm scripts
- [ ] Document coding standards

**Phase 3: Testing Updates**

- [ ] Update Vitest integration tests for Prisma
- [ ] Update E2E tests for new auth
- [ ] Add Prisma test database setup/teardown
- [ ] Ensure all tests pass locally

**Phase 4: CI/CD Pipeline**

- [ ] Add Prisma generate step to CI
- [ ] Add linter check to CI
- [ ] Add Prisma migration check to CI
- [ ] Run unit + E2E tests in CI
- [ ] Build Docker image on merge

**Phase 5: Zeabur Deployment**

- [ ] Create Zeabur project
- [ ] Add PostgreSQL service in Zeabur
- [ ] Configure environment variables
- [ ] Deploy application
- [ ] Run Prisma migrations in production
- [ ] Verify live application works
- [ ] Set up custom domain (optional)

**Test:**

1. ✅ Application works locally with PostgreSQL + Prisma
2. ✅ All tests pass (unit + E2E) locally and in CI
3. ✅ Code quality checks pass (Prettier + ESLint)
4. ✅ CI/CD pipeline is green
5. ✅ Application is deployed and accessible on Zeabur

### MVP 5: Following & Timeline

**Goal:** Users can follow others and see followed posts
**Deliverable:** Social timeline with follow functionality
**Database:** Add `follows` table
**Frontend:**

- [ ] User search and profile pages
- [ ] Follow/unfollow buttons
- [ ] Timeline showing followed users' posts
      **Test:** User can follow others and see their posts in timeline

### MVP 6: Basic Interactions

**Goal:** Users can like and comment on posts
**Deliverable:** Interactive social features
**Database:** Add `likes` and `comments` tables
**Frontend:**

- [ ] Like button with counter
- [ ] Comment form and display
- [ ] Real-time like updates
      **Test:** User can like and comment on posts, see interactions

### MVP 7: Enhanced Features

**Goal:** Polish and advanced features
**Deliverable:** Production-ready app
**Database:** Add `notifications` table
**Frontend:**

- [ ] Media uploads
- [ ] @mentions in posts/comments
- [ ] Notification system
- [ ] Infinite scroll and performance optimizations
      **Test:** Full social media experience with notifications

## Implementation Strategy

Each MVP should be:

- ✅ **Fully functional** - Complete user flow works end-to-end
- ✅ **Deployable** - Can be deployed and tested immediately
- ✅ **Incremental** - Builds on previous MVP without breaking changes
- ✅ **Testable** - Clear success criteria for manual testing
