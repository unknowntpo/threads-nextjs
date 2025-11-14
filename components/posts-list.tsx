'use client';

import { PostCard } from '@/components/post-card';
import { Card, CardContent } from '@/components/ui/card';
import type { PostWithUser } from '@/lib/repositories/post.repository';

interface PostsListProps {
  posts: PostWithUser[];
  currentUserId?: string;
  onEdit?: (post: PostWithUser) => void;
  onDelete?: (postId: string) => void;
  onInteractionChange?: () => void;
  emptyMessage?: string;
}

export function PostsList({
  posts,
  currentUserId,
  onEdit,
  onDelete,
  onInteractionChange,
  emptyMessage = 'No posts yet',
}: PostsListProps) {
  if (posts.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center text-muted-foreground">{emptyMessage}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-1">
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
          onInteractionChange={onInteractionChange}
        />
      ))}
    </div>
  );
}
