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
  original_post_id: uuid NULL (FK posts.id), -- For reposts
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

### MVP 6: Basic Interactions ✅

**Goal:** Users can like, comment, repost, and share posts
**Deliverable:** Interactive social features
**Database:** Add `likes`, `comments` tables, and `originalPostId` field for reposts
**Frontend:**

- [x] Like button with counter and optimistic updates
- [x] Comment API (GET/POST) - UI pending
- [x] Repost functionality (creates new post with originalPostId)
- [x] Share functionality (copy shareable link)
- [x] Visual feedback (heart fill, green repost, checkmark)
- [x] Toast notifications for all interactions
      **Test:** ✅ User can like, repost, and share posts. Comments API ready.

### MVP 7: Notification System 🔔

**Goal:** Users receive notifications for social interactions
**Deliverable:** Real-time notification system for likes, comments, reposts, and mentions
**Database:** `notifications` table (already exists in schema)
**Priority:** High - Essential for user engagement before ML recommendations

**Backend:**

- [ ] `POST /api/notifications/create` - Create notification on interaction
- [ ] `GET /api/notifications` - Fetch user's notifications with pagination
- [ ] `PATCH /api/notifications/[id]/read` - Mark notification as read
- [ ] `PATCH /api/notifications/read-all` - Mark all as read
- [ ] Database triggers or API hooks for:
  - Like notifications (when someone likes your post)
  - Comment notifications (when someone comments on your post)
  - Repost notifications (when someone reposts your post)
  - Mention notifications (when someone @mentions you)
  - Follow notifications (when someone follows you) - future

**Frontend:**

- [ ] `NotificationBell` - Header notification icon with unread count badge
- [ ] `NotificationDropdown` - Dropdown panel showing recent notifications
- [ ] `NotificationList` - Full notifications page with pagination
- [ ] `NotificationItem` - Individual notification card with:
  - User avatar and name
  - Notification type and action
  - Related post preview (if applicable)
  - Timestamp
  - Read/unread status indicator
- [ ] Real-time updates (polling every 30s or WebSocket for future)
- [ ] Toast notifications for new interactions (optional)

**Technical Tasks:**

- [ ] Add notification creation hooks to like/comment/repost APIs
- [ ] Implement efficient notification queries (index on user_id, read, created_at)
- [ ] Build notification polling system (useEffect with interval)
- [ ] Add unread count API and badge display
- [ ] Handle notification navigation (clicking notification goes to related post)
- [ ] Add notification preferences (future: enable/disable by type)

**Test:**

1. User A likes User B's post → User B receives notification
2. User A comments on User B's post → User B receives notification
3. User A reposts User B's post → User B receives notification
4. User A @mentions User B → User B receives notification
5. Notification badge shows correct unread count
6. Clicking notification marks as read and navigates to post
7. Notifications are sorted by newest first

**Effort Estimate:** ~16-24 hours

**Status:** 📋 Ready to implement

---

### MVP 8: Enhanced Features

**Goal:** Polish and advanced features
**Deliverable:** Production-ready app with rich media and mentions
**Frontend:**

- [ ] Media uploads (images/videos in posts)
- [ ] @mentions autocomplete in posts/comments
- [ ] Infinite scroll and performance optimizations
- [ ] Profile pages with user posts
- [ ] Follow/unfollow functionality
      **Test:** Full social media experience with rich content

## Implementation Strategy

Each MVP should be:

- ✅ **Fully functional** - Complete user flow works end-to-end
- ✅ **Deployable** - Can be deployed and tested immediately
- ✅ **Incremental** - Builds on previous MVP without breaking changes
- ✅ **Testable** - Clear success criteria for manual testing

---

## Known Issues

### 1. Forgot Password Page - 404 Not Found ✅ FIXED

**Issue:** `/auth/forgot-password` route returns 404 error

**Error URL:** `https://threads-nextjs.zeabur.app/auth/forgot-password?_rsc=1n57a`

**Root Cause:**

- Login form has link to `/auth/forgot-password` (components/login-form.tsx:72)
- Page route not implemented in `app/auth/forgot-password/page.tsx`

**Solution Implemented:**

- ✅ Created `app/auth/forgot-password/page.tsx` with password reset form
- ✅ Added `ForgotPasswordForm` component with email input
- ✅ Implemented `POST /api/auth/forgot-password` endpoint
- ✅ Security: No email enumeration (always returns success)
- ✅ Shows confirmation screen after submission

**TODO for Future:**

- [ ] Implement actual password reset token generation
- [ ] Add email sending functionality
- [ ] Create reset password confirmation page

**Status:** ✅ Fixed (basic UI/API implemented, email functionality pending)

### 2. Chrome Ad Blocker Warning

**Issue:** Chrome showing warning "This site tends to show ads that interrupt, distract, mislead, or prevent user control"

**Potential Causes:**

1. Next.js aggressive prefetching
2. OAuth redirect flow
3. Third-party scripts flagged by Chrome

**Possible Solutions:**

1. Disable prefetching for OAuth links: `<Link prefetch={false}>`
2. Check Chrome Search Console Abusive Experience Report
3. Review NextAuth redirect configuration

**Status:** ⏸️ Investigating (low priority)

---

## Current Status: MVP 6 Completed ✅

**What's Working:**

- ✅ Authentication (NextAuth with credentials, Google, GitHub)
- ✅ Post creation and display
- ✅ Personalized feed (Phase 1: Random with Fisher-Yates shuffle)
- ✅ Social interactions (Like, Comment, Repost, Share)
- ✅ Full CI/CD pipeline with tests
- ✅ Deployed on Zeabur

**Next Phase:** MVP 7 - Notification System 🔔

**Why Notifications First:**

- Essential for user engagement and retention
- Users need to know when others interact with their content
- Foundation for building an active community
- Lower complexity than ML recommendations (~16-24h vs ~132h)
- ML recommendations will be more valuable with active users receiving notifications

---

## Phase 2: ML-Powered Personalized Feed 🎯

**Epic:** Build complete MLOps cycle for ML-based recommendation system (Local Development Only)

**Documentation:** See `docs/ML_RECOMMENDATION_SYSTEM.md` for complete architecture with Mermaid diagrams

**Goal:** Demonstrate end-to-end ML recommendation pipeline with fake data using modern Python tooling

**Technology Stack:**

- **Python:** uv (package manager), Ruff (linter/formatter), FastAPI, scikit-learn
- **Model:** Collaborative Filtering with Content Boosting
- **Deployment:** Docker Compose (local only, no production deployment yet)

**Deliverable:**

- FastAPI ML service with recommendation endpoints
- Fake user interaction data generation
- Collaborative filtering model training pipeline
- Next.js integration with fallback to random feed
- Complete MLOps cycle (data → train → evaluate → serve)
- CI/CD pipeline for ML service

**Effort Estimate:** ~40-60 hours (focused on local demo, not production)

### Database Schema Changes

**New Tables:**

```sql
-- User interaction events
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  post_id UUID NOT NULL REFERENCES posts(id),
  interaction_type VARCHAR(20) NOT NULL, -- 'view', 'click', 'like', 'share'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB,

  INDEX idx_user_interactions_user_id (user_id),
  INDEX idx_user_interactions_post_id (post_id),
  INDEX idx_user_interactions_created_at (created_at)
);

-- Pre-computed recommendations
CREATE TABLE user_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  post_id UUID NOT NULL REFERENCES posts(id),
  score FLOAT NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,

  UNIQUE(user_id, post_id)
);

-- Optimized indexes for fast recommendation queries
CREATE INDEX idx_user_reco_user_score ON user_recommendations(user_id, score DESC);
CREATE INDEX idx_user_reco_active ON user_recommendations(user_id, expires_at) WHERE expires_at > NOW();
CREATE INDEX idx_user_reco_cleanup ON user_recommendations(expires_at) WHERE expires_at <= NOW();
```

### Implementation Phases

**Phase 2.1: Database Migrations (4h)**

- [ ] Create Prisma migrations for new tables
- [ ] Add optimized indexes
- [ ] Test migrations locally
- [ ] Deploy migrations to Zeabur

**Phase 2.2: Interaction Tracking API (8h)**

- [ ] Create `POST /api/track` endpoint
- [ ] Implement client-side tracking for views/clicks
- [ ] Add event batching for performance
- [ ] Test tracking with real user interactions

**Phase 2.3: Dagster Setup (16h)**

- [ ] Set up Dagster Docker container
- [ ] Configure PostgreSQL resource
- [ ] Create basic pipeline structure
- [ ] Set up daily schedule (2AM UTC)
- [ ] Add monitoring and alerts

**Phase 2.4: ML Model Development (40h)**

- [ ] Choose ML approach (collaborative filtering vs hybrid)
- [ ] Implement feature extraction
- [ ] Build scoring model
- [ ] Handle cold start for new users
- [ ] Test model accuracy offline

**Phase 2.5: Pipeline Integration (20h)**

- [ ] Implement batch recommendation generation
- [ ] Add expired recommendation cleanup
- [ ] Optimize PostgreSQL queries
- [ ] Test pipeline end-to-end

**Phase 2.6: PostgreSQL Optimization (6h)**

- [ ] Add connection pooling (pgBouncer)
- [ ] Configure query performance monitoring
- [ ] Test recommendation query latency (<100ms p95)
- [ ] Consider read replicas if needed

**Phase 2.7: API Updates (8h)**

- [ ] Update `GET /api/feeds` to query recommendations
- [ ] Implement fallback to random posts
- [ ] Add metadata (source: ml_recommendations vs random_fallback)
- [ ] Test API performance

**Phase 2.8: Monitoring & Alerts (14h)**

- [ ] Set up Dagster pipeline monitoring
- [ ] Add PostgreSQL query metrics
- [ ] Create alerts for pipeline failures
- [ ] Dashboard for recommendation quality

**Phase 2.9: Testing & Validation (24h)**

- [ ] Unit tests for recommendation logic
- [ ] Integration tests for Dagster pipeline
- [ ] E2E tests for tracking and feed API
- [ ] Performance testing
- [ ] User acceptance testing

**Total:** ~132 hours

### Success Metrics

- ⚡ Recommendation query latency < 100ms (p95)
- 🎯 Pipeline success rate > 99%
- 🔄 Recommendations refresh daily
- 📊 PostgreSQL query performance tracked
- 📈 User engagement +20% (target)
- 📈 Click-through rate +15% (target)

### Architecture Benefits (PostgreSQL-only)

- ✅ No Redis deployment or management overhead
- ✅ Single source of truth (PostgreSQL only)
- ✅ Reduced operational complexity
- ✅ Lower infrastructure costs

**Status:** 📋 Planning - Ready to start implementation

---

## Technical Debt & Refactoring

### Error Handling Improvements 🔧

**Goal:** Implement proper error handling with trace IDs for debugging without exposing sensitive information

**Current Issues:**

- Generic errors like "CredentialsSignin" don't provide enough context for debugging
- No trace/correlation IDs to track errors across logs
- Sensitive error details might be exposed to users

**Proposed Solution:**

**Backend (API Routes):**

- [ ] Create error handling utility with trace ID generation
- [ ] Log full error details server-side with trace ID
- [ ] Return sanitized errors to client with trace ID
- [ ] Example:
  ```typescript
  {
    "error": "Authentication failed",
    "trace_id": "abc123-def456-ghi789",
    "message": "Please check your credentials and try again"
  }
  ```

**Frontend:**

- [ ] Display user-friendly error messages
- [ ] Show trace ID in error UI for user to report
- [ ] Log errors to console with trace ID for debugging

**Technical Tasks:**

- [ ] Create `lib/errors.ts` with error handling utilities
- [ ] Add trace ID middleware for API routes
- [ ] Update all API error responses
- [ ] Update frontend error handling components
- [ ] Add error logging service (optional: Sentry integration)

**Effort Estimate:** ~8-12 hours

**Priority:** Medium - Improves debugging and user experience

**Status:** 📋 Planned
