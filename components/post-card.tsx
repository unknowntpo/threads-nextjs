'use client'

import { useState } from 'react'
import { PostWithUser } from '@/lib/repositories/post.repository'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Heart, MessageCircle, Repeat2, Share, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface PostCardProps {
  post: PostWithUser
  currentUserId?: string
  onEdit?: (post: PostWithUser) => void
  onDelete?: (postId: string) => void
  onInteractionChange?: () => void
}

export function PostCard({
  post,
  currentUserId,
  onEdit,
  onDelete,
  onInteractionChange,
}: PostCardProps) {
  const isOwner = currentUserId === post.userId
  const { toast } = useToast()

  const [isLiked, setIsLiked] = useState(post.isLikedByUser || false)
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0)
  const [isReposted, setIsReposted] = useState(post.isRepostedByUser || false)
  const [repostCount, setRepostCount] = useState(post._count?.reposts || 0)
  const [commentCount] = useState(post._count?.comments || 0)
  const [isLiking, setIsLiking] = useState(false)
  const [isReposting, setIsReposting] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const handleLike = async () => {
    if (!currentUserId || isLiking) return

    setIsLiking(true)
    const previousLiked = isLiked
    const previousCount = likeCount

    // Optimistic update
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to toggle like')
      }

      onInteractionChange?.()
    } catch {
      // Revert on error
      setIsLiked(previousLiked)
      setLikeCount(previousCount)

      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive',
      })
    } finally {
      setIsLiking(false)
    }
  }

  const handleRepost = async () => {
    if (!currentUserId || isReposting) return

    setIsReposting(true)
    const previousReposted = isReposted
    const previousCount = repostCount

    // Optimistic update
    setIsReposted(!isReposted)
    setRepostCount(isReposted ? repostCount - 1 : repostCount + 1)

    try {
      const response = await fetch(`/api/posts/${post.id}/repost`, {
        method: isReposted ? 'DELETE' : 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to toggle repost')
      }

      toast({
        title: 'Success',
        description: isReposted ? 'Repost removed' : 'Post reposted',
      })

      onInteractionChange?.()
    } catch {
      // Revert on error
      setIsReposted(previousReposted)
      setRepostCount(previousCount)

      toast({
        title: 'Error',
        description: 'Failed to repost',
        variant: 'destructive',
      })
    } finally {
      setIsReposting(false)
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/posts/${post.id}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)

      toast({
        title: 'Success',
        description: 'Link copied to clipboard',
      })

      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="w-full" data-testid="post-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.user.avatarUrl || ''} alt={post.user.username} />
              <AvatarFallback>
                {post.user.displayName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-sm font-semibold" data-testid="post-author">
                {post.user.displayName}
              </p>
              <p className="text-xs text-muted-foreground">@{post.user.username}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt))} ago
            </span>

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(post)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete?.(post.id)}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="whitespace-pre-wrap text-sm" data-testid="post-content">
          {post.content}
        </p>

        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.mediaUrls[0]}
              alt="Post image"
              className="h-auto max-w-full rounded-lg"
            />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2"
            onClick={handleLike}
            disabled={!currentUserId || isLiking}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span className="text-xs">{likeCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2"
            disabled={!currentUserId}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{commentCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2"
            onClick={handleRepost}
            disabled={!currentUserId || isReposting}
          >
            <Repeat2 className={`h-4 w-4 ${isReposted ? 'text-green-500' : ''}`} />
            <span className="text-xs">{repostCount}</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={handleShare}>
            {linkCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Share className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
