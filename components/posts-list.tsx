'use client';

import { PostCard } from '@/components/post-card';
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
    return <div className="p-6 text-center text-muted-foreground">{emptyMessage}</div>;
  }

  return (
    <>
      {posts.map((post, index) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
          onInteractionChange={onInteractionChange}
          variant="divider"
          isLast={index === posts.length - 1}
        />
      ))}
    </>
  );
}
