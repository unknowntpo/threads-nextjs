'use client'

import { useState } from 'react'
import { User } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { LockIcon } from 'lucide-react'

interface ProfileEditFormProps {
  profile: User
  onSuccess?: (updatedProfile: User) => void
  onCancel?: () => void
}

export function ProfileEditForm({ profile, onSuccess, onCancel }: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(profile.displayName || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate locally
      if (displayName && displayName.length > 255) {
        toast({
          title: 'Validation Error',
          description: 'Display name must be 255 characters or less',
          variant: 'destructive',
        })
        return
      }

      if (bio && bio.length > 500) {
        toast({
          title: 'Validation Error',
          description: 'Bio must be 500 characters or less',
          variant: 'destructive',
        })
        return
      }

      if (avatarUrl) {
        try {
          new URL(avatarUrl)
        } catch {
          toast({
            title: 'Validation Error',
            description: 'Please enter a valid URL for avatar',
            variant: 'destructive',
          })
          return
        }
      }

      const response = await fetch('/api/profiles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: displayName || null,
          bio: bio || null,
          avatar_url: avatarUrl || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })

      if (onSuccess) {
        onSuccess(data.profile)
      }
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {/* Username (Read-only) */}
      <div className="grid gap-2">
        <Label htmlFor="username" className="flex items-center gap-2">
          Username
          <LockIcon className="h-3 w-3 text-muted-foreground" />
        </Label>
        <Input
          id="username"
          type="text"
          value={profile.username}
          disabled
          className="cursor-not-allowed bg-muted"
          data-testid="username"
        />
        <p className="text-xs text-muted-foreground">Username cannot be changed</p>
      </div>

      {/* Display Name */}
      <div className="grid gap-2">
        <Label htmlFor="display_name">
          Display Name
          <span className="ml-1 text-xs text-muted-foreground">({displayName.length}/255)</span>
        </Label>
        <Input
          id="display_name"
          type="text"
          placeholder="Your display name"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          maxLength={255}
          data-testid="display_name"
        />
      </div>

      {/* Bio */}
      <div className="grid gap-2">
        <Label htmlFor="bio">
          Bio
          <span className="ml-1 text-xs text-muted-foreground">({bio.length}/500)</span>
        </Label>
        <Textarea
          id="bio"
          placeholder="Tell us about yourself..."
          rows={4}
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={500}
          data-testid="bio"
        />
      </div>

      {/* Avatar URL */}
      <div className="grid gap-2">
        <Label htmlFor="avatar_url">Avatar URL</Label>
        <Input
          id="avatar_url"
          type="url"
          placeholder="https://example.com/avatar.jpg"
          value={avatarUrl}
          onChange={e => setAvatarUrl(e.target.value)}
          data-testid="avatar_url"
        />
        <p className="text-xs text-muted-foreground">Enter a URL to an image for your avatar</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={isLoading} data-testid="save-button">
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            data-testid="cancel-button"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
