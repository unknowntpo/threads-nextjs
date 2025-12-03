'use client';

import React, { useState, useCallback } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserActionMenuProps {
  userId: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  trigger?: React.ReactNode;
  currentUserId?: string;
}

export function UserActionMenu({
  userId,
  username,
  displayName,
  avatarUrl,
  trigger,
  currentUserId,
}: UserActionMenuProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    bio: string | null;
    followersCount: number;
  } | null>(null);
  const [hasfetched, setHasFetched] = useState(false);
  const { toast } = useToast();

  const isViewingSelf = currentUserId === userId;

  const fetchUserInfo = useCallback(async () => {
    if (hasfetched) return;

    setIsLoadingUserInfo(true);
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        setUserInfo({
          bio: data.user?.bio || null,
          followersCount: data.user?._count?.followers || 0,
        });
        setHasFetched(true);
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    } finally {
      setIsLoadingUserInfo(false);
    }
  }, [userId, hasfetched]);

  const handleHoverChange = (open: boolean) => {
    if (open) {
      fetchUserInfo();
    }
  };

  const handleFollowToggle = async () => {
    setIsLoadingFollow(true);
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update follow status');
      }

      setIsFollowing(!isFollowing);
      // Update follower count locally
      setUserInfo(prev =>
        prev
          ? {
              ...prev,
              followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1,
            }
          : null
      );
      toast({
        title: isFollowing ? 'Unfollowed' : 'Followed',
        description: isFollowing
          ? `You unfollowed @${username}`
          : `You are now following @${username}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update follow status',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return username?.slice(0, 2).toUpperCase() || '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <HoverCard openDelay={200} closeDelay={100} onOpenChange={handleHoverChange}>
      {trigger && <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>}
      <HoverCardContent className="w-80" align="start" side="bottom" sideOffset={4}>
        {/* User Info */}
        {isLoadingUserInfo ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start">
              <Avatar className="h-12 w-12">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
            </div>

            <div>
              <p className="font-semibold">{displayName || username}</p>
            </div>

            {userInfo?.bio && <p className="text-sm">{userInfo.bio}</p>}

            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="font-semibold">{userInfo?.followersCount || 0}</span>
                <span className="ml-1 text-muted-foreground">followers</span>
              </div>
            </div>

            {!isViewingSelf && (
              <Button
                data-testid="follow-toggle-button"
                onClick={handleFollowToggle}
                disabled={isLoadingFollow}
                variant={isFollowing ? 'secondary' : 'default'}
                size="sm"
                className="w-full"
              >
                {isLoadingFollow ? (
                  'Loading...'
                ) : isFollowing ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
