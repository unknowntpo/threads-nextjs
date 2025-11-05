'use client'

import { useState, useEffect } from 'react'
import { User } from '@prisma/client'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProfileEditForm } from '@/components/profile-edit-form'
import { UserIcon, EditIcon } from 'lucide-react'

interface ProfileSidebarProps {
  trigger?: React.ReactNode | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ProfileSidebar({ trigger, open, onOpenChange }: ProfileSidebarProps) {
  const [profile, setProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Use controlled or uncontrolled mode
  const isControlled = open !== undefined
  const sheetOpen = isControlled ? open : isOpen
  const setSheetOpen = isControlled ? onOpenChange || (() => {}) : setIsOpen

  useEffect(() => {
    if (sheetOpen) {
      fetchProfile()
    }
  }, [sheetOpen])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profiles')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileUpdate = (updatedProfile: User) => {
    setProfile(updatedProfile)
    setIsEditing(false)
    // Optionally trigger a page refresh or revalidation
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
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      {trigger !== null && (
        <SheetTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon" aria-label="Open profile">
              <UserIcon className="h-5 w-5" />
            </Button>
          )}
        </SheetTrigger>
      )}
      <SheetContent side="left" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Profile' : 'Your Profile'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Update your profile information' : 'View and edit your profile'}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : isEditing && profile ? (
          <ProfileEditForm
            profile={profile}
            onSuccess={handleProfileUpdate}
            onCancel={() => setIsEditing(false)}
          />
        ) : profile ? (
          <div className="mt-6 space-y-6">
            {/* Avatar */}
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatarUrl || profile.image || undefined} />
                <AvatarFallback className="text-2xl">
                  {getInitials(profile.displayName || profile.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="text-lg font-medium">@{profile.username}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Display Name</p>
                <p className="text-lg">{profile.displayName || '-'}</p>
              </div>

              {profile.bio && (
                <div>
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p className="text-sm">{profile.bio}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm">{profile.email}</p>
              </div>
            </div>

            {/* Edit Button */}
            <Button
              onClick={() => setIsEditing(true)}
              className="w-full"
              data-testid="edit-profile-button"
            >
              <EditIcon className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
