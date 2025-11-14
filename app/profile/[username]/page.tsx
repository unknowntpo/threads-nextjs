import { redirect, notFound } from 'next/navigation';
import { ProfileView } from '@/components/profile-view';
import { auth } from '@/auth';
import { ProfileRepository } from '@/lib/repositories/profile.repository';
import { PostRepository } from '@/lib/repositories/post.repository';

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

    // Fetch profile and posts server-side for instant display
    const profileRepo = new ProfileRepository();
    const postRepo = new PostRepository();

    const profile = await profileRepo.findByUsername(username);

    if (!profile) {
      notFound();
    }

    // Fetch user's posts with interaction counts
    const posts = await postRepo.findAllWithCounts(session.user.id, 50, 0);
    const userPosts = posts.filter(post => post.userId === profile.id);

    return (
      <ProfileView
        initialProfile={profile}
        currentUserId={session.user.id}
        initialPosts={userPosts}
      />
    );
  } catch (error) {
    console.error('Error loading profile page:', error);
    redirect('/feed');
  }
}
