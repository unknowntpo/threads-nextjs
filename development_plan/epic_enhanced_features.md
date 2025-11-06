# Epic: Enhanced Features 📋

**Status:** 📋 Planned (Future)
**Priority:** Medium
**Effort:** TBD

## Goal

Polish and advanced features to complete the production-ready social media experience.

## Deliverable

Production-ready app with rich media support, @mentions, infinite scrolling, and comprehensive profile pages.

## Features Planned

### Frontend

#### 1. Media Uploads (Images/Videos in Posts)

- [ ] **Image Upload Component**
  - Drag-and-drop interface
  - Click to browse file picker
  - Image preview before upload
  - Multiple image support (up to 4 per post)
  - Image cropping/resizing UI

- [ ] **Video Upload Component**
  - Video file validation (size, format)
  - Video preview with playback controls
  - Thumbnail generation
  - Duration limits (e.g., max 2 minutes)

- [ ] **Backend API**
  - `POST /api/media/upload` - Upload media files
  - Cloud Storage integration (GCP Cloud Storage or S3)
  - Image optimization (resize, compress)
  - CDN integration for fast delivery
  - Signed URLs for secure access

- [ ] **Post Component Update**
  - Display image galleries (grid layout)
  - Lightbox for image viewing
  - Video player with controls
  - Lazy loading for performance

**Effort:** ~16-24 hours

---

#### 2. @Mentions Autocomplete

- [ ] **Mention Detection**
  - Detect "@" character in post/comment input
  - Trigger autocomplete dropdown
  - Parse mention text for search

- [ ] **User Search API**
  - `GET /api/users/search?q={query}` - Search users by username/display name
  - Debounced requests (300ms)
  - Limit results (max 10)
  - Rank by relevance (followers, mutual follows)

- [ ] **Autocomplete UI**
  - Dropdown component with user list
  - Avatar + username + display name display
  - Keyboard navigation (up/down arrows, enter to select)
  - Click to insert mention

- [ ] **Mention Storage**
  - Store mentions as metadata in posts/comments
  - Link mentions to user IDs
  - Parse mentions on render to create clickable links

- [ ] **Mention Notifications**
  - Create notification when user is mentioned
  - Link to post/comment where mentioned
  - Unread badge for new mentions

**Effort:** ~12-16 hours

---

#### 3. Infinite Scroll & Performance Optimizations

- [ ] **Infinite Scroll Implementation**
  - IntersectionObserver for scroll detection
  - Load more posts when near bottom (e.g., 200px from bottom)
  - Loading skeleton while fetching
  - Error handling for failed loads

- [ ] **Feed API Pagination**
  - Cursor-based pagination (more scalable than offset)
  - `GET /api/feeds?cursor={post_id}&limit=20`
  - Return `nextCursor` for next page
  - Optimize database queries with indexes

- [ ] **Performance Optimizations**
  - React virtualization for long lists (e.g., react-window)
  - Image lazy loading (native `loading="lazy"`)
  - Code splitting for route-based chunking
  - Prefetch next page data on hover
  - Debounce scroll events
  - Optimize re-renders with React.memo

- [ ] **Caching Strategy**
  - Client-side cache for visited posts
  - SWR or React Query for data fetching
  - Stale-while-revalidate pattern
  - Cache invalidation on mutations

**Effort:** ~16-20 hours

---

#### 4. Profile Pages with User Posts

- [ ] **Profile Page Route**
  - `/profile/[username]` - User profile page
  - Display user info (avatar, bio, stats)
  - List user's posts (newest first)
  - Infinite scroll for user posts

- [ ] **User Posts API**
  - `GET /api/users/[id]/posts?cursor={post_id}&limit=20`
  - Filter by user ID
  - Include like/repost counts
  - Include isLikedByUser status for current user

- [ ] **Profile Stats**
  - Post count
  - Follower count
  - Following count
  - Joined date

- [ ] **Profile Actions**
  - Follow/Unfollow button (if not own profile)
  - Edit button (if own profile)
  - Share profile button

- [ ] **Profile Tabs**
  - Posts tab (default)
  - Replies tab (posts with comments)
  - Media tab (posts with images/videos)
  - Likes tab (posts user liked)

**Effort:** ~12-16 hours

---

#### 5. Follow/Unfollow Functionality

- [ ] **Follow Button Component**
  - Show follow state (Following/Follow)
  - Optimistic UI updates
  - Loading states

- [ ] **Follow API**
  - `POST /api/users/[id]/follow` - Follow user
  - `DELETE /api/users/[id]/follow` - Unfollow user
  - Return updated follower count

- [ ] **Followers/Following Lists**
  - `/profile/[username]/followers` - List followers
  - `/profile/[username]/following` - List following
  - Infinite scroll for lists
  - Quick follow/unfollow actions in list

- [ ] **Follow Suggestions**
  - "Suggested for you" section
  - Based on mutual follows
  - Based on similar interests
  - Based on popular users

**Effort:** ~12-16 hours

---

## Testing Strategy

### Unit Tests

- [ ] Media upload validation
- [ ] Mention parsing logic
- [ ] Infinite scroll trigger detection
- [ ] Profile data fetching

### Integration Tests

- [ ] Image upload end-to-end
- [ ] Mention notification creation
- [ ] Follow/unfollow updates counts
- [ ] Infinite scroll loads next page

### E2E Tests

- [ ] User uploads image in post
- [ ] User mentions another user in comment
- [ ] User scrolls to load more posts
- [ ] User visits profile and sees posts
- [ ] User follows/unfollows from profile

## Technical Decisions

### Why Cursor-Based Pagination?

- **Scalability**: Better performance for large datasets
- **Consistency**: Handles new posts being added during pagination
- **Efficiency**: No offset overhead

### Why Cloud Storage for Media?

- **Scalability**: Handles unlimited files
- **CDN**: Fast delivery worldwide
- **Cost-effective**: Pay only for storage used
- **Reliability**: Built-in redundancy

### Why React Virtualization?

- **Performance**: Only renders visible items
- **Scalability**: Handles thousands of posts
- **UX**: Smooth scrolling experience

## Dependencies

### Frontend Libraries

```json
{
  "react-window": "^1.8.10",
  "react-dropzone": "^14.2.3",
  "@tanstack/react-query": "^5.0.0"
}
```

### Backend Services

- Cloud Storage (GCP Cloud Storage or AWS S3)
- CDN (Cloudflare, GCP CDN, or AWS CloudFront)
- Image processing (Sharp or ImageMagick)

## Status

📋 **Planned** - Future enhancement after core features stabilized

**Blockers:**

- None (can start implementation anytime)

**Priority Order:**

1. Infinite Scrolling (highest impact on UX)
2. Profile Pages with User Posts
3. Follow/Unfollow (already partially implemented)
4. @Mentions
5. Media Uploads (most complex)

## Related Epics

- [Epic: Follow & Followers](epic_follow_followers.md) - Foundation for follow functionality
- [Epic: ML Recommendation System](epic_ml_recommendation_system.md) - Infinite scroll backend
- [Epic: Notification System](mvp8_notification.md) - Mention notifications
