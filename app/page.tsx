import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function Home() {
  const session = await auth()

  // Redirect logged-in users to feed
  if (session?.user) {
    redirect('/feed')
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-background">
      <div className="flex w-full flex-1 flex-col items-center">
        <nav className="flex h-16 w-full justify-center border-b border-b-foreground/10">
          <div className="flex w-full max-w-4xl items-center justify-between px-6">
            <Link href="/" className="text-2xl font-bold">
              Threads
            </Link>
          </div>
        </nav>

        <div className="flex max-w-2xl flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="space-y-6">
            <h1 className="text-6xl font-bold text-foreground">Threads</h1>
            <p className="max-w-md text-xl text-muted-foreground">
              Share your thoughts and connect with others in a simple, authentic way.
            </p>

            <div className="flex justify-center gap-4 pt-8">
              <Button asChild size="lg">
                <Link href="/auth/sign-up">Join Threads</Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
