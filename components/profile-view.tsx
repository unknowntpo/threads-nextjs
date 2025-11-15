'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@prisma/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ProfileEditForm } from '@/components/profile-edit-form';
import { PostsList } from '@/components/posts-list';
import { ViewTemplate } from '@/components/view-template';
import type { PostWithUser } from '@/lib/repositories/post.repository';
import { EditIcon, ArrowLeft } from 'lucide-react';

interface ProfileViewProps {
  initialProfile: User;
  currentUserId: string;
  initialPosts: PostWithUser[];
}

export function ProfileView({ initialProfile, currentUserId, initialPosts }: ProfileViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<User>(initialProfile);
  const [posts] = useState<PostWithUser[]>(initialPosts);
  const [isEditing, setIsEditing] = useState(false);

  const handleProfileUpdate = () => {
    setIsEditing(false);
    // Refetch profile
    fetch(`/api/profiles?username=${profile.username}`)
      .then(res => res.json())
      .then(data => setProfile(data.profile))
      .catch(console.error);
  };

  const isOwnProfile = profile.id === currentUserId;

  const header = (
    <div className="relative mb-4 flex items-center justify-center px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.back()}
        className="absolute left-6 h-10 w-10 rounded-full"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <span className="text-base font-semibold">@{profile.username}</span>
    </div>
  );

  const content = (
    <Card className="w-full">
      <CardHeader className="relative pb-4 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{profile.displayName}</h2>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatarUrl || ''} alt={profile.username} />
            <AvatarFallback>{profile.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </div>
        {isOwnProfile && !isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="w-full rounded-lg"
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {isEditing && isOwnProfile ? (
          <ProfileEditForm
            profile={profile}
            onSuccess={handleProfileUpdate}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="space-y-4">
            {profile.bio && (
              <div>
                <h3 className="text-sm font-semibold">Bio</h3>
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <Separator />

      {/* User Posts inside same card */}
      <div className="p-0">
        <PostsList posts={posts} currentUserId={currentUserId} emptyMessage="No posts yet" />
      </div>
    </Card>
  );

  return <ViewTemplate header={header} content={content} centerContent={true} />;
}
