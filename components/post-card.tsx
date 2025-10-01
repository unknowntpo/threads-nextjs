"use client";

import { PostWithProfile } from "@/lib/types/database";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Heart, MessageCircle, Repeat2, Share } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "@/lib/utils";

interface PostCardProps {
  post: PostWithProfile;
  currentUserId?: string;
  onEdit?: (post: PostWithProfile) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, currentUserId, onEdit, onDelete }: PostCardProps) {
  const isOwner = currentUserId === post.user_id;
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.profiles.avatar_url || ''} alt={post.profiles.username} />
              <AvatarFallback>
                {post.profiles.display_name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="font-semibold text-sm">{post.profiles.display_name}</p>
              <p className="text-muted-foreground text-xs">@{post.profiles.username}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(post.created_at))} ago
            </span>
            
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(post)}>
                    Edit
                  </DropdownMenuItem>
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
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        
        {post.image_url && (
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image_url}
              alt="Post image"
              className="rounded-lg max-w-full h-auto"
            />
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4 pt-2 border-t">
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
  );
}