'use client';

import { useState, useEffect } from 'react';
import { PostWithUser } from '@/lib/repositories/post.repository';
import { PostsList } from '@/components/posts-list';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeedProps {
  currentUserId?: string;
}

export function Feed({ currentUserId }: FeedProps) {
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = async (isRefresh = false) => {
    console.log('[Feed] fetchPosts called, isRefresh:', isRefresh);
    if (!isRefresh) setLoading(true);

    try {
      console.log('[Feed] Fetching /api/feeds...');
      const response = await fetch('/api/feeds');
      console.log('[Feed] Response received, status:', response.status);

      const data = await response.json();
      console.log('[Feed] Data parsed:', {
        postsCount: data.posts?.length,
        metadata: data.metadata,
      });

      if (!response.ok) {
        console.error('[Feed] Response not ok:', data.error);
        throw new Error(data.error || 'Failed to fetch posts');
      }

      console.log('[Feed] Setting posts, count:', data.posts?.length || 0);
      setPosts(data.posts || []);
    } catch (error) {
      console.error('[Feed] Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load posts',
        variant: 'destructive',
      });
    } finally {
      console.log('[Feed] Finally block - setting loading to false');
      setLoading(false);
    }
  };

  const handleEdit = (post: PostWithUser) => {
    // TODO: Implement edit functionality
    console.log('Edit post:', post.id);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete post');
      }

      // Remove post from local state
      setPosts(prev => prev.filter(p => p.id !== postId));

      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    console.log('[Feed] Component mounted, currentUserId:', currentUserId);
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading posts...</span>
      </div>
    );
  }

  return (
    <PostsList
      posts={posts}
      currentUserId={currentUserId}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onInteractionChange={() => fetchPosts(true)}
      emptyMessage="No posts yet. Be the first to share something!"
    />
  );
}
