'use client'

import { useState, useEffect, useCallback } from 'react'
import {Post, User} from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProfileEditForm } from '@/components/profile-edit-form'
import { UserIcon, EditIcon } from 'lucide-react'

interface ProfileModalProps {
  trigger?: React.ReactNode | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  userId?: string // Optional: if provided, shows this user's profile (view-only)
}

export function ProfileModal({ trigger, open, onOpenChange, userId }: ProfileModalProps) {
  const [profile, setProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const isViewingOtherUser = !!userId // If userId is provided, we're viewing another user

  // Use controlled or uncontrolled mode
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : isOpen
  const setDialogOpen = isControlled ? onOpenChange || (() => {}) : setIsOpen

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = userId ? `/api/users/${userId}` : '/api/profiles'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setProfile(userId ? data.user : data.profile)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])


  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true)
    try {
      const response = await fetch(`/api/posts?user_id=${profile.id}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setIsLoadingPosts(false)
    }
  }, [profile?.id])

  useEffect(() => {
    if (dialogOpen) {
      fetchProfile()
    }
  }, [dialogOpen, fetchProfile])

  useEffect(() => {
    if (dialogOpen && profile) {
      fetchPosts()
    }
  }, [dialogOpen, profile?.id, fetchPosts])

  const handleProfileUpdate = (updatedProfile: User) => {
    setProfile(updatedProfile)
    setIsEditing(false)
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon" aria-label="Open profile">
              <UserIcon className="h-5 w-5" />
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>{isEditing ? 'Edit Profile' : 'Your Profile'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your profile information' : 'View and manage your profile'}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : isEditing && profile && !isViewingOtherUser ? (
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileEditForm
                profile={profile}
                onSuccess={handleProfileUpdate}
                onCancel={() => setIsEditing(false)}
              />
            </CardContent>
          </Card>
        ) : profile ? (
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-2 text-center">
              {/* Avatar */}
              <div className="mb-4 flex justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatarUrl || profile.image || undefined} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile.displayName || profile.name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <CardTitle className="text-2xl">{profile.displayName}</CardTitle>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Profile Info */}
              {profile.bio && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{profile.bio}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b py-2">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{profile.email}</span>
                </div>

                <div className="flex items-center justify-between border-b py-2">
                  <span className="text-sm text-muted-foreground">Joined</span>
                  <span className="text-sm font-medium">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Edit Button - only show for own profile */}
              {!isViewingOtherUser && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full"
                  data-testid="edit-profile-button"
                >
                  <EditIcon className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              )}
              {/* Display posts for this user */}
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Posts</h3>

                {isLoadingPosts && posts.length == 0 && (
                  <p className="text-sm text-muted-foreground">Loading posts...</p>
                )}

                {!isLoadingPosts && posts.length == 0 && (
                  <p className="text-sm text-muted-foreground">No posts yet</p>
                )}

                {!isLoadingPosts && posts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-4 mb-4">
                    <p className="text-sm">{post.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}

                {/* Single hardcoded post */}
                <div className="mb-4 rounded-lg border p-4">
                  <p className="font-semibold">Test Post Title</p>
                  <p className="text-sm text-muted-foreground">
                    This is a hardcoded post to verify rendering works
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">Posted 2 hours ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center p-12">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
