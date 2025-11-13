# Profile page with Posts

## TODO

- refactor error type in `app/api/posts/route.ts`, custom `InternalServerError`. `InvalidArgumentError`
- `lib/logger.ts` Logger should record request param and session.user.id

When user click a profile of himself or other users. it opens a profile page.  
This page should contains user's information and his historical posts.

Test plan (`e2e/profile.spec.ts`):

- **Setup**:
  - Create test user Alice with 3 posts
  - Create test user Bob (viewer)
- **Test 1: View other user's posts**
  - Login as Bob
  - Click Alice's username in feed
  - Click "Visit Profile"
  - **Assert**: Profile modal shows Alice's info
  - **Assert**: See 3 PostCards with `data-testid="post-card"`
  - **Assert**: Posts ordered by newest first
- **Test 2: View own posts**
  - Login as Alice
  - Click Profile button in sidebar
  - **Assert**: See own 3 posts
  - **Assert**: Edit Profile button visible
- **Test 3: Empty state**
  - Create user Charlie with 0 posts
  - Login as Bob, visit Charlie's profile
  - **Assert**: "No posts yet" message visible
- **Test 4: Loading state** (optional)
  - Mock slow API response
  - **Assert**: Loading spinner visible

---

## Review

### ✅ What's Good

1. **Clear goal**: Show user's posts in profile modal
2. **Identified useEffect pattern**: Matches existing `fetchProfile` approach
3. **Considers both cases**: Self profile + other user profiles
4. **Basic test plan**: Has context and expected behavior

### ⚠️ Issues & Missing Pieces

#### 1. API Endpoint Problem

```
Line 8: It make api call to `api/posts/:userId` with limit: 50
```

❌ **This endpoint doesn't exist!**

**Current endpoints:**

- `/api/posts` - POST only (create post)
- `/api/feeds` - GET feed posts (has pagination)
- `/api/users/[id]` - GET user profile

**Options:**

- **A)** Create new `/api/users/[id]/posts` endpoint
- **B)** Use existing `/api/feeds?userId=xxx` (check if FeedRepository supports filtering)

**TODO:** Check `lib/repositories/feed.repository.ts` - can it filter by userId?

#### 2. Function Name Typo

```diff
Line 7:
- Implement `fetchProfiles` function
+ Implement `fetchPosts` function
```

#### 3. Backend: "No change" is Wrong

You likely need to:

- Create `/api/users/[id]/posts/route.ts` endpoint
- OR add userId filter to FeedRepository (if not exists)

#### 4. Missing State Management

```typescript
// You need in ProfileModal:
const [posts, setPosts] = useState<PostType[]>([]);
const [isLoadingPosts, setIsLoadingPosts] = useState(false);
const [postsError, setPostsError] = useState<string | null>(null);
```

#### 5. Missing Error/Loading/Empty States

- Loading spinner while fetching?
- Error message if API fails?
- "No posts yet" message if user has 0 posts?

#### 6. Missing PostCard Props

```typescript
// PostCard needs:
<PostCard
  post={post}
  currentUserId={session.user.id}  // ❌ Where to get this?
/>
```

**TODO:** How to get `currentUserId` in ProfileModal? (Hint: Check `components/feed.tsx`)

#### 7. useEffect Dependencies

```typescript
// Should be similar to fetchProfile:
useEffect(() => {
  if (dialogOpen && profile) {
    fetchPosts();
  }
}, [dialogOpen, profile?.id, fetchPosts]); // Need all dependencies
```

#### 8. Test Plan Too Vague

Missing:

- E2E test file location: `e2e/profile.spec.ts`
- Specific assertions: "Should see at least 1 post card with test-id"
- Edge cases: Empty posts, loading spinner, error message
- Setup: Create test user + posts before test

### 🎯 Action Items Before Coding

1. Check `lib/repositories/feed.repository.ts` - does `findAll()` accept `userId` filter?
2. Decide: Create new `/api/users/[id]/posts` OR reuse existing endpoint?
3. How to get `currentUserId` in ProfileModal? (Check `components/feed.tsx` for pattern)
4. Pagination: Just show first 50? Or add "Load More" button?
5. Define all 3 states: loading, error, empty
6. Update test plan with specific assertions
