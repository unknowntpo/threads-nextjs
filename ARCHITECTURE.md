# Architecture Overview

This project follows the **POC Pattern** with Next.js API routes instead of Server Actions.

## Directory Structure

```
app/
├── api/                        # Next.js API Routes
│   ├── auth/
│   │   ├── signup/route.ts     # POST /api/auth/signup
│   │   ├── signin/route.ts     # POST /api/auth/signin
│   │   └── signout/route.ts    # POST /api/auth/signout
│   └── profiles/
│       └── route.ts            # GET & POST /api/profiles
├── auth/                       # Auth pages
├── protected/                  # Protected pages
└── page.tsx                    # Home page

components/
├── ui/                         # shadcn/ui components
├── sign-up-form.tsx           # Client component with fetch()
├── login-form.tsx             # Client component with fetch()
├── profile-setup-form.tsx     # Client component with fetch()
└── sign-out-button.tsx        # Client component with fetch()

lib/
├── types/
│   └── database.ts            # TypeScript interfaces
├── supabase/
│   ├── client.ts
│   └── server.ts
└── utils.ts
```

## Data Flow Pattern

### 1. Server Components (Pages)

- Use `fetch()` to call API routes **server-side**
- Initial data loading at request time
- No client-side JavaScript for data fetching

```typescript
// app/protected/page.tsx
export default async function ProtectedPage() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/profiles`, {
    cache: 'no-store'
  });
  const { user, profile } = await response.json();
  return <div>...</div>;
}
```

### 2. Client Components (Forms)

- Use `fetch()` to call API routes **client-side**
- Handle form submissions and mutations
- Use `router.refresh()` to revalidate server component data

```typescript
// components/sign-up-form.tsx
'use client';

const handleSubmit = async (e: React.FormEvent) => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, username }),
  });
  router.push('/protected');
};
```

### 3. API Routes (Backend)

- Direct Supabase calls with validation
- Traditional HTTP request/response pattern
- Swagger documentation ready

```typescript
// app/api/auth/signup/route.ts
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  // Validation
  if (!body.email || !body.password) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
  }

  // Supabase operations
  const { data, error } = await supabase.auth.signUp({ email, password });

  return NextResponse.json({ data });
}
```

## Key Benefits

1. **Familiar HTTP Pattern**: Standard REST API approach
2. **External Client Ready**: APIs can be consumed by mobile apps
3. **Type Safety**: Full TypeScript with interface definitions
4. **Documentation Ready**: Swagger comments for API docs
5. **shadcn/ui**: Modern, accessible components with Tailwind
6. **No Complex State**: Server components handle data, client components handle interactions

## Authentication Flow

1. **Signup**: `SignUpForm` → `POST /api/auth/signup` → Redirect to success page
2. **Login**: `LoginForm` → `POST /api/auth/signin` → Redirect to `/protected`
3. **Profile Setup**: `ProfileSetupForm` → `POST /api/profiles` → Redirect to `/protected`
4. **Protected Page**: Server-side `fetch('/api/profiles')` → Display profile
5. **Logout**: `SignOutButton` → `POST /api/auth/signout` → Redirect to home

This architecture matches your POC pattern and provides a solid foundation for scaling to additional features.
