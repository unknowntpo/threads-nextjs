'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProfileModal } from '@/components/profile-modal'
import { UserIcon, UserPlus, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UserActionMenuProps {
  userId: string
  username: string
  displayName?: string | null
  avatarUrl?: string | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode | null
}

export function UserActionMenu({
  userId,
  username,
  displayName,
  avatarUrl,
  open,
  onOpenChange,
  trigger,
}: UserActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoadingFollow, setIsLoadingFollow] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const { toast } = useToast()

  // Use controlled or uncontrolled mode
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : isOpen
  const setDialogOpen = isControlled ? onOpenChange || (() => {}) : setIsOpen

  const fetchFollowStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.isFollowing)
      }
    } catch (error) {
      console.error('Failed to fetch follow status:', error)
    }
  }, [userId])

  // Fetch follow status when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      fetchFollowStatus()
    }
  }, [dialogOpen, fetchFollowStatus])

  const handleFollowToggle = async () => {
    setIsLoadingFollow(true)
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update follow status')
      }

      setIsFollowing(!isFollowing)
      toast({
        title: isFollowing ? 'Unfollowed' : 'Followed',
        description: isFollowing
          ? `You unfollowed @${username}`
          : `You are now following @${username}`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update follow status',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingFollow(false)
    }
  }

  const handleVisitProfile = () => {
    setDialogOpen(false)
    setIsProfileModalOpen(true)
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return username?.slice(0, 2).toUpperCase() || '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {trigger !== null && (
          <DialogTrigger asChild>
            {trigger || (
              <Button variant="ghost" size="sm">
                <UserIcon className="h-4 w-4" />
              </Button>
            )}
          </DialogTrigger>
        )}
        <DialogContent className="max-w-sm p-6">
          <DialogHeader className="sr-only">
            <DialogTitle>User Actions</DialogTitle>
            <DialogDescription>Follow or view {username}&apos;s profile</DialogDescription>
          </DialogHeader>

          {/* User Info */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-lg">{getInitials(displayName)}</AvatarFallback>
            </Avatar>

            <div className="text-center">
              <p className="font-semibold">{displayName || username}</p>
              <p className="text-sm text-muted-foreground">@{username}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex w-full flex-col gap-2">
              <Button
                onClick={handleFollowToggle}
                disabled={isLoadingFollow}
                variant={isFollowing ? 'secondary' : 'default'}
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

              <Button onClick={handleVisitProfile} variant="outline" className="w-full">
                <UserIcon className="mr-2 h-4 w-4" />
                Visit Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <ProfileModal
        trigger={null}
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
        userId={userId}
      />
    </>
  )
}

// Import the DialogTrigger to avoid error
import { DialogTrigger } from '@/components/ui/dialog'
