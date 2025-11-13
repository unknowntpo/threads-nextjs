import { redirect, notFound } from 'next/navigation';
import { NavSidebar } from '@/components/nav-sidebar';
import { ProfileView } from '@/components/profile-view';
import { auth } from '@/auth';
import { ProfileRepository } from '@/lib/repositories/profile.repository';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ProfilePage({ params }: PageProps) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      redirect('/auth/login');
    }

    const { username } = await params;

    // Fetch profile server-side for instant display
    const profileRepo = new ProfileRepository();
    const profile = await profileRepo.findByUsername(username);

    if (!profile) {
      notFound();
    }

    return (
      <>
        <NavSidebar />
        <div className="flex w-full flex-1 flex-col items-center pl-20">
          <div className="w-full max-w-2xl p-6">
            <ProfileView initialProfile={profile} currentUserId={session.user.id} />
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error('Error loading profile page:', error);
    redirect('/feed');
  }
}
