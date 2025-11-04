import { redirect } from 'next/navigation'
import { ProfileSetupForm } from '@/components/profile-setup-form'
import { SignOutButton } from '@/components/sign-out-button'
import { Feed } from '@/components/feed'
import { CreatePostForm } from '@/components/create-post-form'
import { Separator } from '@/components/ui/separator'
import { auth } from '@/auth'
import { ProfileRepository } from '@/lib/repositories/profile.repository'

export const dynamic = 'force-dynamic'

export default async function ProtectedPage() {
  try {
    const session = await auth()
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] Feed page - session:', session)
    }

    if (!session?.user?.id) {
      redirect('/auth/login')
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] Feed page - About to query profile for user ID:', session.user.id)
    }
    const profileRepo = new ProfileRepository()
    const profile = await profileRepo.findById(session.user.id)
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] Feed page - Profile fetched:', profile)
    }

    if (!profile) {
      // Profile not found, show setup form
      return (
        <div className="flex w-full flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <ProfileSetupForm />
          </div>
        </div>
      )
    }

    const user = session.user

    return (
      <div className="flex w-full flex-1 flex-col items-center">
        <div className="w-full max-w-4xl p-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {profile.displayName}!</h1>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>
            <SignOutButton />
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Create Post Form */}
            <CreatePostForm />

            <Separator />

            {/* Feed */}
            <Feed currentUserId={user.id} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading protected page:', error)
    redirect('/auth/login')
  }
}
