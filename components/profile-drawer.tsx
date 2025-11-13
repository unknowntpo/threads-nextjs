'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Post, User } from '@prisma/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';

interface ProfileDrawerProps {
  userId: string;
  username: string;
  open: boolean;
  onClose: () => void;
}

export function ProfileDrawer({ userId, username, open, onClose }: ProfileDrawerProps) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const { toast } = useToast();

  const currentUserId = session?.user?.id;
  const isOwnProfile = currentUserId === userId;

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setIsFollowing(data.isFollowing || false);
        setFollowerCount(data.followerCount || 0);
        setFollowingCount(data.followingCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchPosts = useCallback(async () => {
    if (!userId) return;

    setIsLoadingPosts(true);
    try {
      const response = await fetch(`/api/posts?user_id=${userId}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open && userId) {
      fetchProfile();
      fetchPosts();
    }
  }, [open, userId, fetchProfile, fetchPosts]);

  const handleFollowToggle = async () => {
    if (!currentUserId || isOwnProfile) return;

    setFollowLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${userId}/follow`, {
        method,
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        toast({
          title: isFollowing ? 'Unfollowed' : 'Followed',
          description: `You ${isFollowing ? 'unfollowed' : 'followed'} @${username}`,
        });
      } else {
        throw new Error('Failed to update follow status');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive',
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="sr-only">
          <SheetTitle>@{username} Profile</SheetTitle>
          <SheetDescription>View profile for @{username}</SheetDescription>
        </SheetHeader>

        {/* Custom Header with Back Button */}
        <div className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-4">
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-semibold">@{username}</h2>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : profile ? (
          <div className="space-y-6 p-6">
            {/* Profile Info */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatarUrl || profile.image || undefined} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile.displayName || profile.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Follow Button - only show for other users */}
                {!isOwnProfile && currentUserId && (
                  <Button
                    onClick={handleFollowToggle}
                    variant={isFollowing ? 'secondary' : 'default'}
                    size="sm"
                    disabled={followLoading}
                  >
                    {followLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFollowing ? (
                      'Following'
                    ) : (
                      'Follow'
                    )}
                  </Button>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold">{profile.displayName}</h3>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>

              {profile.bio && <p className="text-sm">{profile.bio}</p>}

              <div className="flex gap-4 text-sm">
                <div>
                  <span className="font-semibold">{followerCount}</span>{' '}
                  <span className="text-muted-foreground">Followers</span>
                </div>
                <div>
                  <span className="font-semibold">{followingCount}</span>{' '}
                  <span className="text-muted-foreground">Following</span>
                </div>
              </div>
            </div>

            {/* Posts Section */}
            <div className="border-t pt-6">
              <h3 className="mb-4 text-lg font-semibold">Posts</h3>

              {isLoadingPosts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No posts yet</p>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <div key={post.id} className="space-y-2 rounded-lg border p-4">
                      <p className="text-sm">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-12">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
