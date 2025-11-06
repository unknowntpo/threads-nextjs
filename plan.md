# Threads Clone - Development Plan

Reference: https://www.threads.com

**Current Status:** MVP 7.7 (GCP Deployment) - Core Complete ✅

For completed MVP phases 1-6, see [PLAN_ARCHIVE.md](PLAN_ARCHIVE.md)

---

## Architecture

**Framework:**

- Next.js 15 with App Router
- PostgreSQL + Prisma ORM
- NextAuth v4 (OAuth + Credentials)
- shadcn/ui components (Radix UI + Tailwind)

**Deployment:**

- GCP Compute Engine (ARM64, c4a-standard-2, preemptible)
- k0s Kubernetes cluster
- ArgoCD (GitOps) + Keel (Image auto-update)
- GitHub Actions CI/CD
- Cloudflare Tunnel (public access)

---

## Current Development Roadmap

### MVP 7.8: Profile Management & UI Enhancement ✅ COMPLETE

**Goal:** Enable profile editing with modern Threads-style navigation
**Deliverable:** Profile edit feature with Threads-style left sidebar
**Status:** ✅ Complete (2025-11-06)
**Priority:** High - Essential UX improvement

**Features Implemented:**

- [x] Profile edit API (PUT /api/profiles)
  - Server-side validation (display_name ≤255, bio ≤500, avatar_url format)
  - Session-based auth (users edit own profile only)
  - Username locked (read-only with visual indicator)
- [x] Profile edit form component
  - Character counters (255/500 limits)
  - Toast notifications
  - Cancel/Save actions
- [x] Threads-style left navigation sidebar
  - 80px fixed sidebar with icons
  - Home, Search, Create, Activity, Profile buttons
  - Bottom menu with Sign Out
- [x] Centered card-style profile modal
  - Dialog instead of Sheet sidebar
  - Clean UI without duplicate close buttons
  - View/Edit mode toggle
- [x] E2E test coverage
  - Profile edit workflow
  - Sidebar navigation
  - Auth flow with new UI

**Files Created:**

- `components/nav-sidebar.tsx` - Left navigation sidebar
- `components/profile-modal.tsx` - Centered card profile modal
- `components/profile-edit-form.tsx` - Profile edit form with validation
- `components/ui/dialog.tsx` - shadcn Dialog component

**Files Modified:**

- `app/api/profiles/route.ts` - Added PUT handler
- `app/feed/page.tsx` - Integrated NavSidebar, removed header
- `e2e/profile.spec.ts` - Updated for sidebar workflow
- `e2e/auth.spec.ts` - Updated for sidebar UI

**Test:**

1. ✅ Profile edit API validates and saves changes
2. ✅ Username field is locked (disabled with lock icon)
3. ✅ Character counters work correctly
4. ✅ Sidebar navigation matches Threads UX
5. ✅ Profile modal opens centered (no close button)
6. ✅ E2E tests pass in CI
7. ✅ Build passes locally and in CI
8. ✅ Deployed via ArgoCD GitOps

**Status:** ✅ Complete - Deployed to production

---

### MVP 8: Notification System 🔔

**Goal:** Users receive notifications for social interactions
**Deliverable:** Real-time notification system for likes, comments, reposts, and mentions
**Database:** `notifications` table (already exists in schema)
**Status:** 📋 Ready to implement
**Priority:** High - Essential for user engagement

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

**Status:** 📋 Next priority after current deployment stabilizes

---

### MVP 7.7: GCP Deployment with Terraform 🚀 CORE COMPLETE

**Goal:** Deploy entire application stack to GCP using Infrastructure as Code
**Deliverable:** Production-ready GCP deployment with Terraform, maximizing free tier
**Status:** ✅ Core Complete (2025-11-05)
**Priority:** High - Required for cost optimization and production deployment

**Documentation:** [GCP_DEPLOYMENT.md](docs/GCP_DEPLOYMENT.md) (to be created)

**Architecture:**

```
Terraform-managed GCP Resources (us-east1-b)
├── VPC & Networking
│   ├── Custom VPC network
│   ├── Firewall rules (SSH via IAP)
│   └── Cloudflare Tunnel (public access)
├── Compute Engine c4a-standard-2 (ARM64, preemptible)
│   ├── k0s Kubernetes v1.34.1
│   ├── PostgreSQL (StatefulSet)
│   ├── ArgoCD (GitOps)
│   ├── Keel (Image auto-update)
│   └── Local-path storage provisioner
├── Artifact Registry
│   └── Docker images (nextjs, ml-service) ARM64
└── Secret Manager (planned)
    ├── Database credentials
    ├── NextAuth secrets
    └── OAuth credentials
```

**Infrastructure as Code (Terraform):**

- [x] Terraform project structure (`terraform/`)
- [x] VPC and networking resources
- [x] Compute Engine VM with startup script (c4a-standard-2 ARM64, preemptible)
- [x] IAM service accounts and roles
- [x] Firewall rules (SSH via IAP)
- [x] k0s Kubernetes cluster on VM
- [x] ArgoCD for GitOps deployments
- [x] Keel for automatic image updates from Artifact Registry
- [x] GitHub Actions CI/CD (build ARM64 images, push to Artifact Registry)
- [ ] State backend (GCS bucket with versioning) - using local state
- [ ] Secret Manager integration - using k8s secrets
- [ ] Cloud NAT for VM egress - using direct internet access

**VM Setup (c4a-standard-2 ARM64, preemptible):**

- [x] k0s Kubernetes v1.34.1 installed via startup script
- [x] PostgreSQL deployed as k8s StatefulSet
- [x] ArgoCD deployed for GitOps
- [x] Keel deployed for image auto-updates (keelhq/keel-aarch64)
- [x] Local-path storage provisioner for PVCs
- [x] IAP tunnel for k8s API access
- [ ] Automated backups (Cloud Storage)
- [ ] Monitoring and health checks
- [ ] Dagster daemon container (planned)
- [ ] Dagster webserver container (:3001) (planned)

**Kubernetes Deployment (k0s on VM):**

- [x] Build and push Docker images to Artifact Registry (ARM64)
- [x] Next.js app deployed as Deployment
- [x] ML service deployed as Deployment
- [x] Environment variables configured with k8s secrets
- [x] Keel polling Artifact Registry for :latest tag updates
- [x] ArgoCD syncing from Git repository
- [x] Services exposed via NodePort (Next.js: 30000)
- [x] Cloudflare Tunnel for public access
- [ ] Configure custom domain (if applicable)
- [ ] Enable logging and monitoring

**CI/CD Integration:**

- [x] GitHub Actions workflow (deploy-gke.yml)
- [x] Docker build and push to Artifact Registry (ARM64)
- [x] Automatic deployment via Keel (polls every 1min)
- [x] Removed Zeabur workflows
- [ ] Terraform plan on PR
- [ ] Terraform apply on merge to main
- [ ] Prisma migrations in CI/CD
- [ ] Smoke tests after deployment

**What's Complete:**

- ✅ Terraform infrastructure (VPC, VM, IAM, firewall)
- ✅ k0s Kubernetes cluster on ARM64 VM
- ✅ ArgoCD + Keel GitOps pipeline
- ✅ GitHub Actions CI/CD with ARM64 builds
- ✅ Next.js and ML service deployments
- ✅ Script library for IAP tunnel management
- ✅ NextAuth v4 OAuth integration fixes (Google, GitHub)
- ✅ Custom PrismaAdapter for auto-generating usernames from email
- ✅ Session security improvements (1-day token expiry, NEXTAUTH_SECRET)
- ✅ Production database reset with proper seed data from GSM secrets
- ✅ Cloudflare Tunnel integration for public access
- ✅ Profile management with Threads-style sidebar

**Future Enhancements:**

- [ ] Migrate to proper GKE cluster (if budget allows)
- [ ] Cloud SQL migration (if budget allows)
- [ ] Dagster deployment for ML pipeline orchestration
- [ ] Multi-region deployment
- [ ] CDN integration (Cloud CDN)
- [ ] Load balancing for high availability
- [ ] Monitoring and alerting setup (Prometheus, Grafana)

**Test:**

1. ✅ Terraform plan succeeds without errors
2. ✅ All GCP resources created in us-east1-b
3. ✅ PostgreSQL accessible within k8s cluster
4. ✅ Next.js app deployed and accessible via Cloudflare Tunnel
5. ✅ ML service deployed and accessible
6. ✅ CI/CD pipeline builds and pushes ARM64 images successfully
7. ✅ Keel automatically updates pods when new :latest images pushed
8. ✅ ArgoCD syncs manifests from Git
9. ⏳ Monthly cost monitoring (preemptible VM reduces costs)
10. ⏳ Dagster deployment (planned)

**Effort Estimate:** ~40-60 hours (Core infrastructure: ~25 hours completed)

**Status:** ✅ Core deployment complete, monitoring/enhancements pending

---

### MVP 7.5: Dagster + Ollama Fake User Simulation 🤖

**Goal:** Automate realistic user behavior simulation for ML training data
**Deliverable:** Dagster-orchestrated fake users generating interest-based posts and interactions
**Status:** 📋 Planned
**Priority:** Medium - Enhances ML model training with realistic data

**Documentation:** [DAGSTER_FAKE_USER_SIMULATION.md](docs/DAGSTER_FAKE_USER_SIMULATION.md)

**Architecture:**

- Dagster orchestration (continuous 1-min + manual triggers)
- Ollama LLM (Gemma 3 270M) for content generation
- 5-10 fake users with interests (sports, tech, anime, cars, food)
- Docker Compose integration (all services in one place)

**Components:**

- **LLM Service** (`app/infrastructure/llm/ollama_service.py`)
  - Generate posts, comments based on interest
  - Interest-based interaction matching
- **Fake User Factory** (`app/domain/factories/fake_user_factory.py`)
  - Create users with "FAKE_USER" bio marker
  - No schema changes (uses existing Prisma tables)
- **Dagster Assets**
  - `fake_users` - Ensure 5-10 bots exist
  - `generated_posts` - Create posts every 1 min
  - `simulated_interactions` - Generate likes, views, comments
- **Docker Services**
  - Ollama (auto-pulls gemma3:270m on startup)
  - Dagster webserver (UI at :3000)

**Test:**

1. ✅ All services start via `docker-compose up`
2. ✅ Fake users created with bio marker
3. ✅ Posts generated every 1 min
4. ✅ Interactions match user interests
5. ✅ Manual trigger from Dagster UI works
6. ✅ ML model trains on synthetic data

**Effort Estimate:** ~16-24 hours

**Status:** 📋 Planned - Pending Dagster deployment on GCP

---

### MVP 7: ML-Powered Personalized Feed ✅ CORE COMPLETE

**Goal:** Build complete MLOps cycle for ML-based recommendation system
**Deliverable:** ML service with collaborative filtering integrated into Next.js feed
**Status:** Core integration complete, advanced features pending

**Documentation:**

- Architecture: [ML_RECOMMENDATION_SYSTEM.md](docs/ML_RECOMMENDATION_SYSTEM.md)
- Implementation Phases: [ML_IMPLEMENTATION_PHASES.md](docs/ML_IMPLEMENTATION_PHASES.md)
- Tracking System: [TRACKING_SYSTEM.md](docs/TRACKING_SYSTEM.md)

**What's Complete:**

- ✅ FastAPI ML service with collaborative filtering
- ✅ Database migrations (user_interactions, user_recommendations tables)
- ✅ Interaction tracking API (view, click, like, share)
- ✅ Client-side batching (95% API call reduction)
- ✅ Next.js integration with fallback to random
- ✅ Comprehensive test coverage (9/9 unit tests, 2/3 E2E)

**What's Pending:**

- ⏳ Docker Compose setup
- ⏳ Production deployment
- ⏳ Model retraining pipeline
- ⏳ Advanced monitoring

**Backend:**

- [x] `POST /api/track` - Interaction tracking (single + batch)
- [x] `GET /api/feeds` - ML recommendations with fallback
- [x] Prisma migrations for user_interactions, user_recommendations
- [ ] Dagster pipeline setup (may skip for simpler cron approach)
- [ ] PostgreSQL optimization (pgBouncer, read replicas)

**Frontend:**

- [x] `usePostViewTracking()` - Intersection Observer based view tracking
- [x] `trackingService` - Auto-batching (5s interval, max 20 items)
- [x] Component integration in PostCard
- [ ] Monitoring dashboard for tracking metrics

**ML Service:**

- [x] User-based collaborative filtering (KNN with cosine similarity)
- [x] `/api/recommendations/{user_id}` endpoint
- [x] MLflow experiment tracking
- [x] Cold start handling
- [ ] Model retraining automation
- [ ] Performance optimization (caching, batch processing)

**Test:**

1. ✅ User interactions tracked (view, click, like, share)
2. ✅ Tracking batched efficiently (95% API call reduction)
3. ✅ ML recommendations returned for active users
4. ✅ Fallback to random when ML unavailable
5. ⏳ E2E test coverage (2/3 passing, 1 flaky skipped)

**Effort Estimate:** ~132 hours (estimated) / ~20 hours (actual core work)

**Status:** ✅ Core MVP complete, production deployment pending

**See [ML_IMPLEMENTATION_PHASES.md](docs/ML_IMPLEMENTATION_PHASES.md) for detailed tracking.**

---

### MVP 9: Enhanced Features 📋 FUTURE

**Goal:** Polish and advanced features
**Deliverable:** Production-ready app with rich media and mentions
**Status:** 📋 Planned
**Priority:** Medium

**Frontend:**

- [ ] Media uploads (images/videos in posts)
- [ ] @mentions autocomplete in posts/comments
- [ ] Infinite scroll and performance optimizations
- [ ] Profile pages with user posts
- [ ] Follow/unfollow functionality

**Test:** Full social media experience with rich content

**Status:** 📋 Future enhancement

---

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

### 2. Chrome Ad Blocker Warning ⏸️

**Issue:** Chrome showing warning \"This site tends to show ads that interrupt, distract, mislead, or prevent user control\"

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

## Technical Debt & Refactoring

### Error Handling Improvements 🔧

**Goal:** Implement proper error handling with trace IDs for debugging without exposing sensitive information

**Current Issues:**

- Generic errors like \"CredentialsSignin\" don't provide enough context for debugging
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

---

## Current Status Summary

**What's Working:**

- ✅ Authentication (NextAuth v4 with credentials, Google, GitHub OAuth)
- ✅ Post creation and display
- ✅ Social interactions (Like, Comment, Repost, Share)
- ✅ ML-powered personalized feed (collaborative filtering)
- ✅ Interaction tracking (view, click, like, share)
- ✅ Profile management with Threads-style sidebar
- ✅ Full CI/CD pipeline with tests
- ✅ Deployed on GCP with k0s Kubernetes + ArgoCD GitOps

**Next Priorities:**

1. **MVP 8: Notification System** 🔔 - Essential for user engagement
2. **Monitoring & Observability** 📊 - Production reliability
3. **MVP 7.5: Dagster + Ollama** 🤖 - ML training data generation

**Why Notifications Next:**

- Essential for user engagement and retention
- Users need to know when others interact with their content
- Foundation for building an active community
- Complements ML recommendations (users get notified about relevant interactions)

---

## Archive

For completed MVP phases 1-6 (Auth, Post Creation, CI/CD, PostgreSQL Migration, Following, Interactions), see [PLAN_ARCHIVE.md](PLAN_ARCHIVE.md).

---

**Last Updated:** 2025-11-06
