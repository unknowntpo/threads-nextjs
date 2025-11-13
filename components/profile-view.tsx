'use client';

import { useState, useEffect } from 'react';
import type { User } from '@prisma/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileEditForm } from '@/components/profile-edit-form';
import { EditIcon, Loader2 } from 'lucide-react';

interface ProfileViewProps {
  username: string;
  currentUserId: string;
}

export function ProfileView({ username, currentUserId }: ProfileViewProps) {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        // First, get profile by username
        const response = await fetch(`/api/profiles?username=${username}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const handleProfileUpdate = () => {
    setIsEditing(false);
    // Refetch profile
    fetch(`/api/profiles?username=${username}`)
      .then(res => res.json())
      .then(data => setProfile(data.profile))
      .catch(console.error);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>Profile not found</p>
      </div>
    );
  }

  const isOwnProfile = profile.id === currentUserId;

  return (
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
  );
}
