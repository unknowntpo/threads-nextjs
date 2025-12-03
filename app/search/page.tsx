import { redirect } from 'next/navigation';
import { ViewTemplate } from '@/components/view-template';
import { Search } from '@/components/search';
import { auth } from '@/auth';
import { ProfileRepository } from '@/lib/repositories/profile.repository';

export const dynamic = 'force-dynamic';

export default async function SearchPage() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      redirect('/auth/login');
    }

    const profileRepo = new ProfileRepository();
    const profile = await profileRepo.findById(session.user.id);

    if (!profile) {
      // Redirect to feed which will show profile setup
      redirect('/feed');
    }

    const user = session.user;

    return <ViewTemplate content={<Search currentUserId={user.id} />} centerContent={true} />;
  } catch (error) {
    console.error('Error loading search page:', error);
    redirect('/auth/login');
  }
}
