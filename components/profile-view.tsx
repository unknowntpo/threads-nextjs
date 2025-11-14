'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@prisma/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileEditForm } from '@/components/profile-edit-form';
import { PostsList } from '@/components/posts-list';
import { CreatePostForm } from '@/components/create-post-form';
import type { PostWithUser } from '@/lib/repositories/post.repository';
import { EditIcon, ChevronLeft } from 'lucide-react';

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

  return (
    <div className="w-full space-y-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back</span>
      </Button>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatarUrl || ''} alt={profile.username} />
              <AvatarFallback>{profile.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{profile.displayName}</h2>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </div>
          {isOwnProfile && !isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
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
      </Card>

      {/* CreatePostForm - Only on own profile */}
      {isOwnProfile && <CreatePostForm />}

      {/* User Posts */}
      <PostsList posts={posts} currentUserId={currentUserId} emptyMessage="No posts yet" />
    </div>
  );
}
