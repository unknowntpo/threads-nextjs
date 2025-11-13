# Threads Clone - Development Plan

Reference: https://www.threads.com

**Current Status:** Multiple Epics Complete ✅

For completed MVP phases 1-6, see [PLAN_ARCHIVE.md](../PLAN_ARCHIVE.md)

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

### Completed Epics ✅

**[Epic: Follow & Followers](epic_follow_followers.md)** 🤝

- Status: ✅ Complete (2025-11-13)
- Follow/unfollow functionality, follower counts, UserActionMenu with HoverCard
- Clickable usernames, profile hover cards (Twitter/X-like behavior)
- 13 integration tests + 7 E2E tests + 5 component tests

**[Epic: Profile Management & UI Enhancement](epic_profile_management.md)** 📝

- Status: ✅ Complete (2025-11-06)
- Profile edit API, Threads-style sidebar, profile modal, character limits
- Deployed to production

**[Epic: ML-Powered Personalized Feed](epic_ml_recommendation_system.md)** 🤖

- Status: ✅ Core Complete
- FastAPI ML service, collaborative filtering, interaction tracking, 95% API call reduction
- Production deployment pending

**[Epic: GCP Deployment with Terraform](epic_gcp_deployment.md)** 🚀

- Status: ✅ Core Complete (2025-11-05)
- Terraform infrastructure, k0s Kubernetes, ArgoCD + Keel GitOps, CI/CD pipeline
- Monitoring and enhancements pending

---

### In Progress Epics 🚧

**[Epic: Threads UI Refactor](epic_threads_ui_refactor.md)** 🎨

- Status: 🚧 In Progress (Started: 2025-11-13)
- Priority: High - Visual redesign to match Threads app
- Card roundness (16px), spacing (4px), profile drawer navigation
- Effort: ~8-12 hours

---

### Planned Epics 📋

**[Epic: Notification System](mvp8_notification.md)** 🔔

- Status: 📋 Planned
- Priority: High - Essential for user engagement
- Real-time notifications for likes, comments, reposts, mentions
- Effort: ~16-24 hours

**[Epic: Dagster + Ollama Fake User Simulation](epic_dagster_fake_users.md)** 🤖

- Status: 📋 Planned
- Priority: Medium - ML training data generation
- Orchestrated fake users, interest-based posts and interactions
- Effort: ~16-24 hours

**[Epic: Error Handling Improvements](epic_error_handling.md)** 🔧

- Status: 📋 Planned
- Priority: Medium - Debugging and UX improvement
- Trace IDs, sanitized errors, centralized logging
- Effort: ~8-12 hours

**[Epic: Enhanced Features](epic_enhanced_features.md)** 📋

- Status: 📋 Planned (Future)
- Priority: Medium
- Media uploads, @mentions, infinite scroll, profile pages
- Effort: TBD

---

## Implementation Strategy

Each Epic should be:

- ✅ **Fully functional** - Complete user flow works end-to-end
- ✅ **Deployable** - Can be deployed and tested immediately
- ✅ **Incremental** - Builds on previous Epic without breaking changes
- ✅ **Testable** - Clear success criteria for manual testing

---

## Current Status Summary

**What's Working:**

- ✅ Authentication (NextAuth v4 with credentials, Google, GitHub OAuth)
- ✅ Post creation and display
- ✅ Social interactions (Like, Comment, Repost, Share)
- ✅ Follow/unfollow functionality with user profiles
- ✅ ML-powered personalized feed (collaborative filtering)
- ✅ Interaction tracking (view, click, like, share)
- ✅ Profile management with Threads-style sidebar
- ✅ Full CI/CD pipeline with tests
- ✅ Deployed on GCP with k0s Kubernetes + ArgoCD GitOps

**Next Priorities:**

1. **Infinite Scrolling & User Posts** 📜 - Feed pagination and profile posts display
2. **Epic: Notification System** 🔔 - Essential for user engagement
3. **Monitoring & Observability** 📊 - Production reliability
4. **Epic: Dagster + Ollama** 🤖 - ML training data generation

---

## Archive

For completed MVP phases 1-6 (Auth, Post Creation, CI/CD, PostgreSQL Migration, Following, Interactions), see [PLAN_ARCHIVE.md](../PLAN_ARCHIVE.md).

---

**Last Updated:** 2025-11-13
