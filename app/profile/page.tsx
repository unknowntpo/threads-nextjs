import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function ProfileRedirectPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  redirect('/feed');
}
