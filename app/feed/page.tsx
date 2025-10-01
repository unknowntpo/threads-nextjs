import { redirect } from "next/navigation";
import { ProfileSetupForm } from "@/components/profile-setup-form";
import { SignOutButton } from "@/components/sign-out-button";
import { Feed } from "@/components/feed";
import { CreatePostForm } from "@/components/create-post-form";
import { Separator } from "@/components/ui/separator";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export default async function ProtectedPage() {
  try {
    const cookieStore = await cookies();
    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/profiles`;
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Cookie: cookieStore.toString(),
      },
    });

    if (response.status === 401) {
      redirect("/auth/login");
    }

    if (response.status === 404) {
      // Profile not found, show setup form
      return (
        <div className="flex-1 w-full flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <ProfileSetupForm />
          </div>
        </div>
      );
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }

    const { user, profile } = await response.json();

    return (
      <div className="flex-1 w-full flex flex-col items-center">
        <div className="w-full max-w-4xl p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {profile.display_name}!</h1>
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
    );
  } catch (error) {
    console.error("Error loading protected page:", error);
    redirect("/auth/login");
  }
}
