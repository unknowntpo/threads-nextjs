# Threads Clone with NestJS + Vite + React

Reference: https://www.threads.com

## Architecture

**Backend:**
- NestJS (TypeScript)
- PostgreSQL (Database)
- Prisma/TypeORM (ORM)
- JWT Authentication
- Docker Compose (Local deployment)

**Frontend:**
- Vite + React + TypeScript
- TanStack Query (Data fetching)
- React Router (Routing)
- Tailwind CSS + shadcn/ui (Styling)

**Testing:**
- Playwright (E2E testing)
- Vitest (Unit tests - Backend & Frontend)
- Supertest (API tests)

**Deployment:**
- Docker Compose (Local)
- Zeabur (Cloud deployment)

## Database Schema

```sql
-- Users table
users (
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email: varchar(255) UNIQUE NOT NULL,
  password_hash: varchar(255) NOT NULL,
  username: varchar(50) UNIQUE NOT NULL,
  display_name: varchar(100),
  bio: text,
  avatar_url: text,
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
)

-- Posts table
posts (
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id: uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content: text NOT NULL,
  media_urls: text[],
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
)

-- Follows relationship
follows (
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id: uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id: uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at: timestamp DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
)

-- Likes
likes (
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id: uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id: uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at: timestamp DEFAULT now(),
  UNIQUE(user_id, post_id)
)

-- Comments
comments (
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id: uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id: uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content: text NOT NULL,
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
)

-- Notifications
notifications (
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id: uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type: varchar(50) NOT NULL, -- 'new_post', 'like', 'comment', 'follow'
  related_user_id: uuid REFERENCES users(id) ON DELETE CASCADE,
  related_post_id: uuid REFERENCES posts(id) ON DELETE CASCADE,
  read: boolean DEFAULT false,
  created_at: timestamp DEFAULT now()
)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/posts` - Get user's posts
- `GET /api/users/:id/followers` - Get user's followers
- `GET /api/users/:id/following` - Get users being followed

### Posts
- `GET /api/posts` - Get timeline/feed posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get post by ID
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like a post
- `DELETE /api/posts/:id/like` - Unlike a post

### Comments
- `GET /api/posts/:id/comments` - Get post comments
- `POST /api/posts/:id/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Follows
- `POST /api/users/:id/follow` - Follow user
- `DELETE /api/users/:id/follow` - Unfollow user

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## Project Structure

```
threads-app/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # Users module
│   │   ├── posts/          # Posts module
│   │   ├── comments/       # Comments module
│   │   ├── follows/        # Follows module
│   │   ├── notifications/  # Notifications module
│   │   ├── database/       # Database config & migrations
│   │   └── common/         # Shared utilities
│   ├── test/               # E2E & Integration tests
│   ├── Dockerfile
│   └── package.json
├── frontend/               # Vite + React Frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── api/            # API client
│   │   ├── lib/            # Utilities
│   │   └── types/          # TypeScript types
│   ├── tests/              # Playwright E2E tests
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml      # Local development setup
└── README.md
```

## Development Phases (TDD Approach)

### Phase 1: Project Setup & Docker Compose ✅
**Goal:** Set up monorepo with NestJS backend and Vite frontend, with Docker Compose for local development
**Tasks:**
- [x] Initialize NestJS backend with TypeScript
- [x] Initialize Vite + React + TypeScript frontend
- [x] Set up PostgreSQL in docker-compose.yml (port 5433)
- [x] Configure Prisma for database
- [x] Create initial database migrations
- [x] Set up environment variables
- [x] Configure CORS between frontend and backend
- [x] Migrate from Jest to Vitest for backend testing
- [x] Configure TypeScript with CommonJS for NestJS
- [x] Remove obsolete Next.js configuration files
- [ ] Write setup documentation
**Test:** `docker-compose up` starts all services successfully ✅

### Phase 2: Authentication Module (TDD)
**Goal:** Implement JWT-based authentication with full test coverage
**Backend Tasks:**
- [ ] Write unit tests for AuthService (register, login, validate token)
- [ ] Implement AuthService with bcrypt password hashing
- [ ] Write e2e tests for auth endpoints
- [ ] Implement AuthController (register, login, refresh, me)
- [ ] Add JWT Guards and Strategies
- [ ] Write integration tests with test database
**Frontend Tasks:**
- [ ] Write Playwright tests for signup flow
- [ ] Implement signup page
- [ ] Write Playwright tests for login flow
- [ ] Implement login page
- [ ] Set up TanStack Query for API calls
- [ ] Implement auth context/state management
**Test:** All tests pass (unit, integration, e2e)

### Phase 3: User Profile Module (TDD)
**Goal:** User profile CRUD with tests
**Backend Tasks:**
- [ ] Write unit tests for UsersService
- [ ] Implement UsersService (get, update profile)
- [ ] Write e2e tests for user endpoints
- [ ] Implement UsersController
**Frontend Tasks:**
- [ ] Write Playwright tests for profile page
- [ ] Implement profile view page
- [ ] Write Playwright tests for profile edit
- [ ] Implement profile edit form
**Test:** All tests pass, users can view/edit profiles

### Phase 4: Posts Module (TDD)
**Goal:** Create, read, update, delete posts with tests
**Backend Tasks:**
- [ ] Write unit tests for PostsService
- [ ] Implement PostsService (CRUD operations)
- [ ] Write e2e tests for post endpoints
- [ ] Implement PostsController
- [ ] Add pagination support
**Frontend Tasks:**
- [ ] Write Playwright tests for post creation
- [ ] Implement post composer
- [ ] Write Playwright tests for post feed
- [ ] Implement post feed/timeline
- [ ] Add infinite scroll
**Test:** All tests pass, users can create and view posts

### Phase 5: Social Features (TDD)
**Goal:** Follows, likes, comments with full testing
**Backend Tasks:**
- [ ] Write tests for FollowsService
- [ ] Implement FollowsService and Controller
- [ ] Write tests for LikesService
- [ ] Implement likes functionality
- [ ] Write tests for CommentsService
- [ ] Implement comments functionality
**Frontend Tasks:**
- [ ] Write Playwright tests for follow/unfollow
- [ ] Implement follow button
- [ ] Write Playwright tests for likes
- [ ] Implement like button
- [ ] Write Playwright tests for comments
- [ ] Implement comment system
**Test:** All social features work with passing tests

### Phase 6: Notifications Module (TDD)
**Goal:** Real-time notifications with WebSocket
**Backend Tasks:**
- [ ] Write tests for NotificationsService
- [ ] Implement NotificationsService
- [ ] Set up WebSocket Gateway
- [ ] Write e2e tests for notifications
**Frontend Tasks:**
- [ ] Write Playwright tests for notifications
- [ ] Implement notification UI
- [ ] Set up WebSocket client
**Test:** Notifications work in real-time

### Phase 7: Production Deployment
**Goal:** Deploy to Zeabur with CI/CD
**Tasks:**
- [ ] Create production Dockerfiles
- [ ] Set up Zeabur configuration
- [ ] Configure environment variables for production
- [ ] Set up database migrations for production
- [ ] Deploy backend to Zeabur
- [ ] Deploy frontend to Zeabur
- [ ] Configure domain and SSL
- [ ] Run all tests against production
**Test:** Application works in production with all tests passing

## Testing Strategy

**Backend:**
- **Unit Tests:** Vitest for service layer logic
- **Integration Tests:** Supertest for API endpoints with test database
- **E2E Tests:** Full flow testing with Docker

**Frontend:**
- **Component Tests:** Vitest + React Testing Library
- **E2E Tests:** Playwright for user flows

**Coverage Goals:**
- Backend: 80%+ code coverage
- Frontend: 70%+ code coverage
- E2E: All critical user flows covered

**Test Execution:**
- All tests must pass before merging to main
- Run tests in CI/CD pipeline
- Run E2E tests against staging environment