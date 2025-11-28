'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchInput } from '@/components/search-input';
import { SearchTabs } from '@/components/search-tabs';
import { PostsList } from '@/components/posts-list';
import { EmptySearchState } from '@/components/empty-search-state';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PostWithUser } from '@/lib/repositories/post.repository';

interface SearchProps {
  currentUserId?: string;
}

interface SearchResponse {
  results: Array<{
    type: 'post';
    score: number;
    data: PostWithUser;
  }>;
  metadata: {
    total: number;
    count: number;
    offset: number;
    limit: number;
    hasMore: boolean;
    query: string;
    filter: string;
  };
}

type SearchFilter = 'top' | 'recent';

export function Search({ currentUserId }: SearchProps) {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // Actual query being searched
  const [filter, setFilter] = useState<SearchFilter>('top');
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const { toast } = useToast();
  const observerTarget = useRef<HTMLDivElement>(null);

  const limit = 20;

  const fetchResults = async (
    searchTerm: string,
    currentFilter: SearchFilter,
    currentOffset: number,
    append: boolean = false
  ) => {
    if (!searchTerm.trim()) {
      setPosts([]);
      setHasMore(false);
      return;
    }

    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        q: searchTerm.trim(),
        filter: currentFilter,
        limit: limit.toString(),
        offset: currentOffset.toString(),
      });

      const response = await fetch(`/api/search?${params}`);
      const data: SearchResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search');
      }

      const newPosts = data.results.map(result => result.data);

      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setHasMore(data.metadata.hasMore);
    } catch (error) {
      console.error('Error searching:', error);
      toast({
        title: 'Error',
        description: 'Failed to search posts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (!query.trim()) return;

    setSearchQuery(query);
    setOffset(0);
    setPosts([]);
    fetchResults(query, filter, 0, false);
  };

  const handleTabChange = (newFilter: SearchFilter) => {
    setFilter(newFilter);
    if (searchQuery) {
      setOffset(0);
      setPosts([]);
      fetchResults(searchQuery, newFilter, 0, false);
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

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoading && searchQuery) {
        const newOffset = offset + limit;
        setOffset(newOffset);
        fetchResults(searchQuery, filter, newOffset, true);
      }
    },
    [hasMore, isLoading, offset, searchQuery, filter, limit, fetchResults]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0,
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver]);

  return (
    <div>
      <SearchInput
        value={query}
        onChange={setQuery}
        onSubmit={handleSearch}
        placeholder="Search posts..."
      />

      {searchQuery && <SearchTabs activeTab={filter} onTabChange={handleTabChange} />}

      {isLoading && posts.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Searching...</span>
        </div>
      ) : posts.length > 0 ? (
        <>
          <PostsList
            posts={posts}
            currentUserId={currentUserId}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onInteractionChange={() => {
              // Refresh search results
              if (searchQuery) {
                setOffset(0);
                fetchResults(searchQuery, filter, 0, false);
              }
            }}
            emptyMessage="No posts found"
          />

          {/* Infinite scroll trigger */}
          <div ref={observerTarget} className="h-4 w-full" />

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="ml-2 text-sm">Loading more...</span>
            </div>
          )}
        </>
      ) : (
        <EmptySearchState query={searchQuery} />
      )}
    </div>
  );
}
