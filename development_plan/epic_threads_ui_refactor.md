# Epic: Threads UI Refactor 🎨

**Status:** 🚧 In Progress
**Priority:** High - Visual redesign to match Threads app
**Effort:** ~8-12 hours
**Started:** 2025-11-13

---

## Objective

Refactor the UI to closely match Threads design language with:

- More rounded cards (16px border radius)
- Connected card layout with minimal spacing (4px gap)
- Profile drawer navigation that slides in from right
- Smooth transitions and animations

---

## Design Specifications

### Card Design

- **Border Radius:** 16px (`rounded-2xl`)
- **Spacing Between Cards:** 4px (`space-y-1`)
- **Borders:** Remove card borders (Threads uses subtle shadows/dividers)
- **Shadow:** Subtle shadow (`shadow-sm`)
- **Dividers:** Use bottom border or separator between cards

### Profile Navigation

- **Component:** Drawer/Sheet (slides from right)
- **Animation:** 300ms slide-in, 200ms slide-out
- **Header:** Back arrow (X icon) + username
- **Content:** Avatar, displayName, bio, followers count, user posts
- **Future:** May convert to route-based (`/[username]`) navigation

### Animations

- Drawer slide transitions
- Smooth hover states
- Button press feedback

---

## Backend Tasks

### 1. No Backend Changes Required ✅

- All APIs already exist:
  - `/api/users/[id]` - Get user info
  - `/api/posts?user_id=X` - Get user posts
  - `/api/users/[id]/follow` - Follow/unfollow

---

## Frontend Tasks

### Phase 1: Global Styles ✅

**File:** `app/globals.css`

- [x] Change CSS variable `--radius: 0.5rem` → `1rem` (8px → 16px)

### Phase 2: Card Component

**File:** `components/ui/card.tsx`

- [ ] Remove `border` class from Card
- [ ] Change shadow: `shadow` → `shadow-sm`
- [ ] Keep `rounded-xl` (will now be 16px from CSS variable)

### Phase 3: Feed Layout

**File:** `components/feed.tsx`

- [ ] Change card spacing: `space-y-4` → `space-y-1` (16px → 4px)
- [ ] Consider adding divider/border between cards

**File:** `components/post-card.tsx`

- [ ] Review card padding/spacing
- [ ] Optional: Add bottom border as divider

### Phase 4: Profile Drawer Implementation

**Step 1: Verify Sheet Component**

- [ ] Confirm `components/ui/sheet.tsx` exists and works
- [ ] Test Sheet slide animations

**Step 2: Create ProfileDrawer Component**

**New File:** `components/profile-drawer.tsx`

```typescript
interface ProfileDrawerProps {
  username: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}
```

**Features:**

- Fetch user data on mount (`/api/users/[id]`)
- Fetch user posts (`/api/posts?user_id=X`)
- Header: Back button (X icon) + username
- Body: Avatar, displayName, bio, followers/following counts
- Posts section: User's posts in feed format
- Slide animation from right (300ms ease-out)

**Step 3: Update Profile Navigation**

**Files to Modify:**

- `components/post-card.tsx` (lines 262-277, 418-432)
- `components/user-action-menu.tsx`

**Changes:**

- Add drawer state management
- On username click: Open ProfileDrawer
- Pass userId/username to drawer
- Replace modal behavior with drawer

### Phase 5: Animations & Transitions

**File:** `components/profile-drawer.tsx`

- [ ] Slide-in from right: 300ms ease-out
- [ ] Slide-out to right: 200ms ease-in
- [ ] Backdrop fade: 200ms
- [ ] Smooth transitions on hover states

---

## Testing Tasks

### Unit Tests

**File:** `tests/components/profile-drawer.test.tsx` (NEW)

- [ ] Drawer opens when triggered
- [ ] Back button closes drawer
- [ ] User data fetches and displays
- [ ] User posts load correctly
- [ ] Follow button works in drawer
- [ ] Drawer closes on backdrop click

**Update Existing Tests:**

**File:** `tests/components/post-card.test.tsx`

- [ ] Update assertions for borderless cards
- [ ] Test drawer opens on username click

**File:** `tests/components/user-action-menu.test.tsx`

- [ ] Update for drawer instead of modal

### E2E Tests

**File:** `e2e/profile.spec.ts`

- [ ] Add test: Open profile drawer from post
- [ ] Add test: Navigate between users in drawer
- [ ] Add test: Close drawer with back button
- [ ] Verify animations are smooth

---

## Acceptance Criteria

### Visual Design ✅

- [ ] Cards have 16px border radius
- [ ] Cards have 4px gap between them
- [ ] Cards have no borders, only subtle shadow
- [ ] Overall feel matches Threads app

### Profile Navigation ✅

- [ ] Clicking username opens profile drawer
- [ ] Drawer slides in from right smoothly
- [ ] Back button closes drawer
- [ ] User info displays correctly
- [ ] User posts load in drawer
- [ ] Can follow/unfollow from drawer

### Animations ✅

- [ ] Drawer slide animation is smooth (300ms)
- [ ] Backdrop fades in/out correctly
- [ ] No janky transitions

### Testing ✅

- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Manual testing confirms UI matches Threads

### Build & Deployment ✅

- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No console warnings/errors
- [ ] Performance is acceptable

---

## Dependencies

- ✅ `@radix-ui/react-dialog` (already installed)
- ✅ `@radix-ui/react-hover-card` (already installed)
- ✅ `components/ui/sheet.tsx` (already exists)

---

## Implementation Notes

### Design Decisions

**Why Drawer instead of Route?**

- User requested drawer approach
- Can change to route-based later
- Maintains scroll position on main feed
- Faster perceived performance

**Why 16px border radius?**

- Threads uses larger radius than typical Material Design
- Creates softer, more modern feel
- User specifically requested matching Threads

**Why 4px card gap?**

- Creates "connected" feel while maintaining visual separation
- Threads has minimal spacing between posts
- User wanted cards to feel connected

### Future Enhancements

**Route-Based Profiles** (Future)

- Create `app/[username]/page.tsx`
- Deep-linkable profiles
- Better SEO
- Browser back button support

**Animation Library** (Optional)

- Consider Framer Motion for advanced animations
- Currently using Radix built-in transitions

**Performance Optimization**

- Virtualize long post lists in profile drawer
- Lazy load user data
- Cache profile data

---

## Related Epics

- **[Epic: Follow & Followers](epic_follow_followers.md)** - Follow system (completed)
- **[Epic: Profile Management](epic_profile_management.md)** - Profile edit (completed)

---

## Progress Tracking

**Phase 1: Global Styles** - ⏳ Not Started
**Phase 2: Card Component** - ⏳ Not Started
**Phase 3: Feed Layout** - ⏳ Not Started
**Phase 4: Profile Drawer** - ⏳ Not Started
**Phase 5: Animations** - ⏳ Not Started
**Testing** - ⏳ Not Started

---

**Last Updated:** 2025-11-13
