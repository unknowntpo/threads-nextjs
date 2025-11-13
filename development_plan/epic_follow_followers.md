# Epic: Follow & Followers 🤝

**Status:** ✅ Complete (2025-11-13)
**Priority:** High - Core social feature
**Effort:** ~20 hours (actual)
**Final Update:** Added HoverCard component for Twitter/X-like profile hover behavior

## Goal

Users can follow other users and build their social network within the platform.

## Deliverable

Complete follow/unfollow functionality with:

- Follow/unfollow actions
- Follower and following counts
- Follow status checking
- User action menu (Follow/Visit Profile)
- Clickable usernames throughout the app

## Features Implemented

### Backend

✅ **FollowRepository** (`lib/repositories/follow.repository.ts`)

- `create(followerId, followingId)` - Create follow relationship
- `delete(followerId, followingId)` - Remove follow relationship
- `isFollowing(followerId, followingId)` - Check follow status
- `getFollowerCount(userId)` - Count followers
- `getFollowingCount(userId)` - Count following

✅ **ProfileRepository Enhancement** (`lib/repositories/profile.repository.ts`)

- `findByIdWithCounts(id)` - Fetch user with follower/following counts
- Includes `_count` aggregations for stats

✅ **User Profile API** (`app/api/users/[id]/route.ts`)

- GET endpoint returns user profile with stats
- Returns `isFollowing` status for current user
- Returns `followerCount` and `followingCount`

✅ **Follow/Unfollow API** (`app/api/users/[id]/follow/route.ts`)

- POST - Follow a user
- DELETE - Unfollow a user
- Validation: Cannot follow yourself
- Validation: Cannot follow twice
- Error handling for non-existent users

### Frontend

✅ **UserActionMenu Component** (`components/user-action-menu.tsx`)

- Dialog popup with user info (avatar, display name, username)
- Follow/Unfollow button with loading states
- Visit Profile button (opens ProfileModal)
- Optimistic UI updates
- Toast notifications for actions
- Controlled/uncontrolled mode support

✅ **ProfileModal Enhancement** (`components/profile-modal.tsx`)

- Added `userId` prop for viewing other users
- View-only mode when viewing others (no Edit button)
- Fetches from `/api/users/[id]` when userId provided
- Shows follower/following stats

✅ **PostCard Enhancements** (`components/post-card.tsx`)

- Clickable post author names
- Clickable comment author names
- Each opens UserActionMenu
- Independent menu state per comment
- Disabled for own posts/comments

### Database

✅ **Follow Model** (Prisma schema)

```prisma
model Follow {
  id          String   @id @default(cuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower  User @relation("UserFollowers", fields: [followerId])
  following User @relation("UserFollowing", fields: [followingId])

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
```

## Testing

### Integration Tests (13 tests)

**File:** `tests/lib/repositories/follow.repository.test.ts`

✅ Create follow relationship
✅ Fail when following same user twice
✅ Delete follow relationship
✅ Fail when deleting non-existent follow
✅ Check isFollowing (true case)
✅ Check isFollowing (false case)
✅ Directional behavior (A follows B ≠ B follows A)
✅ Get follower count (with followers)
✅ Get follower count (zero)
✅ Get following count (with following)
✅ Get following count (zero)
✅ Mutual follows
✅ Update counts when unfollowing

### E2E Tests (7 tests)

**File:** `e2e/follow.spec.ts`

✅ Follow user from post card
✅ Unfollow user from user action menu
✅ View user profile from user action menu
✅ Follow/unfollow updates counts in profile
✅ Cannot follow yourself
✅ Clickable usernames in comments
✅ Follow status persists across page refreshes

## Files Created

- `lib/repositories/follow.repository.ts` (51 lines)
- `app/api/users/[id]/route.ts` (54 lines)
- `app/api/users/[id]/follow/route.ts` (123 lines)
- `components/user-action-menu.tsx` (185 lines)
- `tests/lib/repositories/follow.repository.test.ts` (188 lines)
- `e2e/follow.spec.ts` (281 lines)

## Files Modified

- `lib/repositories/profile.repository.ts` (+20 lines) - Added findByIdWithCounts
- `components/profile-modal.tsx` (+15 lines) - Added userId prop support
- `components/post-card.tsx` (+75 lines) - Clickable usernames

## Commits

- **ed8ce3b** - `feat: implement follow/unfollow functionality`
  - Core follow system (FollowRepository, APIs, UserActionMenu)
  - ProfileModal userId prop
  - Clickable post author names
  - Integration and E2E tests

- **810433f** - `feat: add clickable usernames in comments`
  - Comment authors clickable
  - Independent UserActionMenu per comment
  - User ID in comment type

## Technical Decisions

### Follow Model Design

- **Directional relationships**: Following is one-way (A follows B ≠ B follows A)
- **Compound unique index**: `[followerId, followingId]` prevents duplicate follows
- **Separate indexes**: Optimized for queries by follower or following
- **Prisma \_count**: Efficient aggregation for stats

### UI Pattern

- **Two-modal approach**:
  - **UserActionMenu**: Quick actions (Follow/Visit Profile) - minimal Dialog
  - **ProfileModal**: Full profile view (bio, stats, future: posts)
- **Separation of concerns**: Action menu ≠ profile viewer

### State Management

- **Controlled/uncontrolled modes**: UserActionMenu supports both
- **Optimistic updates**: Instant UI feedback for follow/unfollow
- **Independent state**: Each comment has its own menu state
- **useCallback hooks**: Prevent unnecessary re-fetches

### Next.js 15 Compatibility

- **Async params pattern**: `{ params: Promise<{ id: string }> }` in route handlers
- **Await params**: `const { id } = await params` before use

## Next Steps

- [ ] Add infinite scrolling to feed
- [ ] Display user posts in ProfileModal
- [ ] Feed filtering by followed users
- [ ] Real-time follow count updates
- [ ] Follow suggestions/recommendations

## Related Documentation

- [SESSION_SUMMARY.md](../.claude/SESSION_SUMMARY.md) - Complete session history
- [Follow Repository Tests](../tests/lib/repositories/follow.repository.test.ts)
- [Follow E2E Tests](../e2e/follow.spec.ts)
