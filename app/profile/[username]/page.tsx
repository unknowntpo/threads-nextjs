import { redirect } from 'next/navigation';
import { NavSidebar } from '@/components/nav-sidebar';
import { ProfileView } from '@/components/profile-view';
import { auth } from '@/auth';

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

    return (
      <>
        <NavSidebar />
        <div className="flex w-full flex-1 flex-col items-center pl-20">
          <div className="w-full max-w-2xl p-6">
            <ProfileView username={username} currentUserId={session.user.id} />
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error('Error loading profile page:', error);
    redirect('/feed');
  }
}
