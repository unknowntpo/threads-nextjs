import { AuthButton } from "@/components/auth-button";
import { Button } from "@/components/ui/button";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-background">
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-4xl flex justify-between items-center px-6">
            <Link href="/" className="text-2xl font-bold">
              Threads
            </Link>
            {hasEnvVars && <AuthButton />}
          </div>
        </nav>
        
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl px-6 text-center">
          <div className="space-y-6">
            <h1 className="text-6xl font-bold text-foreground">
              Threads
            </h1>
            <p className="text-xl text-muted-foreground max-w-md">
              Share your thoughts and connect with others in a simple, authentic way.
            </p>
            
            <div className="flex gap-4 pt-8">
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
  );
}
