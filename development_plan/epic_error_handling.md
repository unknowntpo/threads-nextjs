# Epic: Error Handling Improvements 🔧

**Status:** 📋 Planned
**Priority:** Medium - Improves debugging and user experience
**Effort:** ~8-12 hours (estimated)

## Goal

Implement proper error handling with trace IDs for debugging without exposing sensitive information.

## Deliverable

Comprehensive error handling system with trace IDs, sanitized error messages, and centralized logging.

## Current Issues

### Problem 1: Generic Error Messages

- Generic errors like "CredentialsSignin" don't provide enough context for debugging
- Users see cryptic error messages
- Developers can't trace errors through logs

### Problem 2: No Trace/Correlation IDs

- No way to correlate errors across logs
- Can't track user error flow
- Difficult to reproduce issues

### Problem 3: Potential Security Leaks

- Sensitive error details might be exposed to users
- Stack traces visible in production
- Database errors leak schema information

## Proposed Solution

### Backend (API Routes)

#### 1. Error Handling Utility

**File:** `lib/errors.ts`

```typescript
// Generate unique trace ID
export function generateTraceId(): string {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public traceId: string
  ) {
    super(message);
  }
}

// Sanitize error for client
export function sanitizeError(error: Error, traceId: string) {
  return {
    error: error.message,
    trace_id: traceId,
    message: 'An error occurred. Please try again.',
  };
}

// Log error server-side
export function logError(error: Error, traceId: string, context?: any) {
  console.error({
    trace_id: traceId,
    error: error.message,
    stack: error.stack,
    context,
  });
}
```

#### 2. Trace ID Middleware

**File:** `middleware/trace.ts`

```typescript
import { NextRequest } from 'next/server';

export function withTrace(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const traceId = generateTraceId();
    req.headers.set('x-trace-id', traceId);

    try {
      return await handler(req, ...args);
    } catch (error) {
      logError(error, traceId, {
        url: req.url,
        method: req.method,
      });

      return NextResponse.json(sanitizeError(error, traceId), { status: 500 });
    }
  };
}
```

#### 3. Update All API Error Responses

**Example:** `app/api/profiles/route.ts`

```typescript
export const PUT = withTrace(async (request: NextRequest) => {
  const traceId = request.headers.get('x-trace-id')!;

  try {
    // ... existing logic
  } catch (error) {
    logError(error, traceId, { userId: session.user.id });

    return NextResponse.json(
      {
        error: 'Failed to update profile',
        trace_id: traceId,
        message: 'Unable to update your profile. Please try again.',
      },
      { status: 500 }
    );
  }
});
```

### Frontend

#### 1. Error Display Component

**File:** `components/error-display.tsx`

```tsx
interface ErrorDisplayProps {
  error: {
    error: string;
    trace_id: string;
    message: string;
  };
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div className="rounded-lg bg-red-50 p-4">
      <h3 className="font-semibold text-red-800">Error</h3>
      <p className="text-red-700">{error.message}</p>
      <p className="mt-2 text-sm text-red-600">
        Trace ID: <code className="rounded bg-red-100 px-2 py-1">{error.trace_id}</code>
      </p>
      <p className="mt-1 text-xs text-red-500">
        Please provide this trace ID when reporting the issue.
      </p>
    </div>
  );
}
```

#### 2. Error Toast Notification

**File:** `hooks/use-error-toast.ts`

```typescript
import { useToast } from '@/hooks/use-toast'

export function useErrorToast() {
  const { toast } = useToast()

  return (error: any) => {
    toast({
      title: 'Error',
      description: error.message || 'Something went wrong',
      variant: 'destructive',
      action: error.trace_id && (
        <Button variant="outline" size="sm" onClick={() => {
          navigator.clipboard.writeText(error.trace_id)
          toast({ title: 'Trace ID copied' })
        }}>
          Copy Trace ID
        </Button>
      )
    })
  }
}
```

#### 3. Error Logging

**File:** `lib/error-logger.ts`

```typescript
export function logClientError(error: Error, context?: any) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Client Error:', error, context);
  }

  // Send to error tracking service (optional)
  // Sentry.captureException(error, { extra: context })
}
```

## Technical Tasks

### Phase 1: Core Implementation

- [ ] Create `lib/errors.ts` with error handling utilities
- [ ] Create trace ID generation function
- [ ] Create error sanitization function
- [ ] Create server-side error logging function

### Phase 2: Middleware

- [ ] Add trace ID middleware for API routes
- [ ] Implement automatic trace ID generation
- [ ] Implement catch-all error handler

### Phase 3: API Updates

- [ ] Update all API routes to use error middleware
- [ ] Replace generic error responses with sanitized errors
- [ ] Add trace IDs to all error responses
- [ ] Test error handling in each API route

### Phase 4: Frontend Components

- [ ] Create `ErrorDisplay` component
- [ ] Create `useErrorToast` hook
- [ ] Update all components to use new error handling
- [ ] Test error display in UI

### Phase 5: Optional Enhancements

- [ ] Integrate Sentry or similar error tracking service
- [ ] Add error rate monitoring
- [ ] Create error analytics dashboard
- [ ] Set up alerts for high error rates

## Error Response Format

### Standard Error Response

```json
{
  "error": "Authentication failed",
  "trace_id": "1699564800000-abc123-def456-ghi789",
  "message": "Please check your credentials and try again"
}
```

### Fields

- **error**: Short error identifier (for logging)
- **trace_id**: Unique trace ID for debugging
- **message**: User-friendly error message

## Error Categories

### 400 Bad Request

- Invalid input data
- Missing required fields
- Validation errors

**Example:**

```json
{
  "error": "ValidationError",
  "trace_id": "...",
  "message": "Display name must be less than 255 characters"
}
```

### 401 Unauthorized

- Not authenticated
- Invalid credentials
- Expired session

**Example:**

```json
{
  "error": "Unauthorized",
  "trace_id": "...",
  "message": "Please log in to continue"
}
```

### 403 Forbidden

- Not authorized to perform action
- Insufficient permissions

**Example:**

```json
{
  "error": "Forbidden",
  "trace_id": "...",
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found

- Resource not found
- Invalid ID

**Example:**

```json
{
  "error": "NotFound",
  "trace_id": "...",
  "message": "The requested resource was not found"
}
```

### 500 Internal Server Error

- Database errors
- Unexpected errors
- Service unavailable

**Example:**

```json
{
  "error": "InternalServerError",
  "trace_id": "...",
  "message": "Something went wrong. Please try again later."
}
```

## Logging Strategy

### Server-Side Logging

```typescript
console.error({
  timestamp: new Date().toISOString(),
  trace_id: traceId,
  level: 'error',
  error: {
    message: error.message,
    stack: error.stack,
    code: error.code,
  },
  context: {
    userId: session?.user?.id,
    url: request.url,
    method: request.method,
  },
});
```

### Client-Side Logging

```typescript
logClientError(error, {
  component: 'PostCard',
  action: 'like',
  postId: post.id,
});
```

## Testing

### Unit Tests

- [ ] Test trace ID generation (uniqueness)
- [ ] Test error sanitization (no sensitive data)
- [ ] Test error logging (correct format)
- [ ] Test middleware error handling

### Integration Tests

- [ ] Test API error responses include trace IDs
- [ ] Test error logging captures context
- [ ] Test error display in UI components
- [ ] Test trace ID copy to clipboard

### E2E Tests

- [ ] Trigger 400 error and verify user sees friendly message
- [ ] Trigger 401 error and verify redirect to login
- [ ] Trigger 500 error and verify trace ID displayed
- [ ] Verify trace ID can be copied

## Monitoring & Alerts

### Metrics to Track

- Error rate by endpoint
- Error rate by type (400, 401, 500)
- Most common error messages
- Average errors per user session

### Alerts

- High error rate (> 5% of requests)
- Spike in 500 errors
- Authentication errors spike
- Database connection errors

## Optional: Sentry Integration

### Setup

```bash
npm install @sentry/nextjs
```

### Configuration

```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Add trace ID to Sentry event
    if (hint.originalException?.trace_id) {
      event.tags = {
        ...event.tags,
        trace_id: hint.originalException.trace_id,
      };
    }
    return event;
  },
});
```

## Status

📋 **Planned** - Medium priority technical debt

**Benefits:**

- Faster debugging with trace IDs
- Better user experience with friendly error messages
- Improved security by hiding sensitive errors
- Foundation for error analytics

**Blockers:**

- None (can start implementation anytime)
