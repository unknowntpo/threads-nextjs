'use client'

import { PostWithUser } from '@/lib/repositories/post.repository'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Heart, MessageCircle, Repeat2, Share } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from '@/lib/utils'

interface PostCardProps {
  post: PostWithUser
  currentUserId?: string
  onEdit?: (post: PostWithUser) => void
  onDelete?: (postId: string) => void
}

export function PostCard({ post, currentUserId, onEdit, onDelete }: PostCardProps) {
  const isOwner = currentUserId === post.userId

  return (
    <Card className="w-full">
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
              <p className="text-sm font-semibold">{post.user.displayName}</p>
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
        <p className="whitespace-pre-wrap text-sm">{post.content}</p>

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
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <Heart className="h-4 w-4" />
            <span className="text-xs">0</span>
          </Button>

          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">0</span>
          </Button>

          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <Repeat2 className="h-4 w-4" />
            <span className="text-xs">0</span>
          </Button>

          <Button variant="ghost" size="sm">
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
