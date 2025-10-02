# Threads clone with Supabase backend

Reference: https://www.threads.com

## Arch

Framework:
- NextJS
- Supabase

Please ref this POC for integration of them.
/Users/unknowntpo/repo/unknowntpo/playground-2022/supabase/nextjs_example

## Database Schema

```sql
-- Users table (extends Supabase auth.users)
profiles (
  id: uuid (FK to auth.users.id),
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
  user_id: uuid (FK profiles.id),
  content: text,
  media_urls: text[],
  created_at: timestamp,
  updated_at: timestamp
)

-- Follows relationship
follows (
  id: uuid PRIMARY KEY,
  follower_id: uuid (FK profiles.id),
  following_id: uuid (FK profiles.id),
  created_at: timestamp,
  UNIQUE(follower_id, following_id)
)

-- Likes
likes (
  id: uuid PRIMARY KEY,
  user_id: uuid (FK profiles.id),
  post_id: uuid (FK posts.id),
  created_at: timestamp,
  UNIQUE(user_id, post_id)
)

-- Comments
comments (
  id: uuid PRIMARY KEY,
  user_id: uuid (FK profiles.id),
  post_id: uuid (FK posts.id),
  content: text,
  created_at: timestamp,
  updated_at: timestamp
)

-- Notifications
notifications (
  id: uuid PRIMARY KEY,
  user_id: uuid (FK profiles.id),
  type: varchar, -- 'new_post', 'like', 'comment', 'follow'
  related_user_id: uuid (FK profiles.id),
  related_post_id: uuid (FK posts.id) NULL,
  read: boolean DEFAULT false,
  created_at: timestamp
)
```

## Features Implementation

### 1. Post Creation Feature

**Backend:**
- API Route: `POST /api/posts`
- Supabase Functions: `create_post()`, `notify_followers()`
- Real-time updates via Supabase Realtime

**Frontend Components:**
- `PostComposer` - Text area with media upload
- `PostSubmissionState` - Loading/success/error states
- `MediaUploader` - Handle image/video uploads

**Technical Tasks:**
- Set up Supabase Storage bucket for media
- Implement RLS policies for posts table
- Create post creation API route with validation
- Build composer UI with rich text support
- Implement real-time notification system
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
- Add real-time comment updates
- Implement follow/unfollow with RLS updates
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
- Implement follow/unfollow with proper RLS
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
- Supabase Auth for authentication
- Supabase Database with RLS
- Supabase Realtime for live updates
- Supabase Storage for media
- Direct Supabase calls in API routes

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

### MVP 4: Local Development & Deployment Setup
**Goal:** Set up local Supabase development environment, test in CI/CD, and deploy to Zeabur
**Deliverable:** Live, publicly accessible application with complete development workflow
**Services:**
- Supabase CLI (Local development)
- Supabase Cloud (Production)
- Zeabur (Deployment platform)
**Tasks:**
- [ ] Install and configure Supabase CLI
- [ ] Initialize local Supabase project with Docker
- [ ] Set up local database with migrations
- [ ] Configure local Supabase Storage for media
- [ ] Test RLS policies locally
- [ ] Create seed data for local testing
- [ ] Configure environment variables for local/production
- [ ] Set up Supabase Cloud project for production
- [ ] Write Playwright E2E tests for full user flows (FE + BE integration)
  - Auth flow (signup, login, logout)
  - Post creation and display in feed
  - User profile view and edit
- [ ] Test database migrations in CI/CD pipeline
- [ ] Run E2E tests in CI/CD pipeline
- [ ] Deploy Docker image to Zeabur
- [ ] Configure Zeabur environment variables
- [ ] Connect Zeabur app to Supabase Cloud
- [ ] Set up custom domain (optional)
- [ ] Configure SSL/TLS (auto via Zeabur)
**Test:**
1. Application works locally with Supabase CLI
2. All E2E tests pass locally and in CI/CD
3. CI/CD pipeline runs migrations successfully
4. Application is accessible via Zeabur public URL

**Known Build Warnings (non-blocking):**
- Edge Runtime warning: Supabase Realtime uses Node.js APIs in middleware (acceptable for now)
- Deprecated `punycode` module warning from dependencies (will be fixed upstream)

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