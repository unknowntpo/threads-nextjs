'use client'

import { useState, useEffect } from 'react'
import { PostWithUser } from '@/lib/repositories/post.repository'
import { PostCard } from './post-card'
import { Button } from './ui/button'
import { RefreshCw, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FeedProps {
  currentUserId?: string
}

export function Feed({ currentUserId }: FeedProps) {
  const [posts, setPosts] = useState<PostWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchPosts = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      // Use personalized feed endpoint instead of chronological posts
      const response = await fetch('/api/feeds')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch posts')
      }

      setPosts(data.posts || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast({
        title: 'Error',
        description: 'Failed to load posts',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleEdit = (post: PostWithUser) => {
    // TODO: Implement edit functionality
    console.log('Edit post:', post.id)
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete post')
      }

      // Remove post from local state
      setPosts(prev => prev.filter(p => p.id !== postId))

      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting post:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    fetchPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading posts...</span>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Feed</h2>
        <Button variant="outline" size="sm" onClick={() => fetchPosts(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
