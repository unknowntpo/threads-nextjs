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
