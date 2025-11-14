'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PostWithUser } from '@/lib/repositories/post.repository';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserActionMenu } from '@/components/user-action-menu';
import { MoreHorizontal, Heart, MessageCircle, Repeat2, Share, Check, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { usePostViewTracking } from '@/hooks/use-post-tracking';
import { trackClick, trackLike, trackShare } from '@/lib/utils/tracking';

interface PostCardProps {
  post: PostWithUser;
  currentUserId?: string;
  onEdit?: (post: PostWithUser) => void;
  onDelete?: (postId: string) => void;
  onInteractionChange?: () => void;
}

export function PostCard({
  post,
  currentUserId,
  onEdit,
  onDelete,
  onInteractionChange,
}: PostCardProps) {
  const isOwner = currentUserId === post.userId;
  const { toast } = useToast();

  // Track post views
  const postRef = usePostViewTracking({
    postId: post.id,
    threshold: 0.5,
    minDuration: 1000,
    source: 'feed',
  });

  const [isLiked, setIsLiked] = useState(post.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0);
  const [isReposted, setIsReposted] = useState(post.isRepostedByUser || false);
  const [repostCount, setRepostCount] = useState(post._count?.reposts || 0);
  const [commentCount] = useState(post._count?.comments || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState<
    Array<{
      id: string;
      content: string;
      createdAt: string;
      user: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
      };
    }>
  >([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  const handleLike = async () => {
    if (!currentUserId || isLiking) return;

    setIsLiking(true);
    const previousLiked = isLiked;
    const previousCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      // Track like interaction (only on like, not unlike)
      if (!previousLiked) {
        trackLike(post.id, { source: 'feed' });
      }

      onInteractionChange?.();
    } catch {
      // Revert on error
      setIsLiked(previousLiked);
      setLikeCount(previousCount);

      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async () => {
    if (!currentUserId || isReposting) return;

    setIsReposting(true);
    const previousReposted = isReposted;
    const previousCount = repostCount;

    // Optimistic update
    setIsReposted(!isReposted);
    setRepostCount(isReposted ? repostCount - 1 : repostCount + 1);

    try {
      const response = await fetch(`/api/posts/${post.id}/repost`, {
        method: isReposted ? 'DELETE' : 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle repost');
      }

      toast({
        title: 'Success',
        description: isReposted ? 'Repost removed' : 'Post reposted',
      });

      onInteractionChange?.();
    } catch {
      // Revert on error
      setIsReposted(previousReposted);
      setRepostCount(previousCount);

      toast({
        title: 'Error',
        description: 'Failed to repost',
        variant: 'destructive',
      });
    } finally {
      setIsReposting(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/posts/${post.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);

      // Track share interaction
      trackShare(post.id, { source: 'feed', method: 'clipboard' });

      toast({
        title: 'Success',
        description: 'Link copied to clipboard',
      });

      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handlePostClick = () => {
    // Track click interaction on post content
    trackClick(post.id, { source: 'feed' });
  };

  const handleCommentButtonClick = async () => {
    if (!currentUserId) return;

    setShowCommentForm(!showCommentForm);

    // Load comments if not already loaded
    if (!commentsLoaded && !showCommentForm) {
      try {
        const response = await fetch(`/api/posts/${post.id}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
          setCommentsLoaded(true);
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load comments',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUserId || !commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);

    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentText.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const data = await response.json();

      // Add new comment to the list
      setComments([data.comment, ...comments]);
      setCommentText('');

      toast({
        title: 'Success',
        description: 'Comment posted',
      });

      onInteractionChange?.();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <>
      <Card className="w-full" data-testid="post-card" ref={postRef}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.user.avatarUrl || ''} alt={post.user.username} />
                <AvatarFallback>
                  {post.user.displayName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <UserActionMenu
                userId={post.user.id}
                username={post.user.username}
                displayName={post.user.displayName}
                avatarUrl={post.user.avatarUrl}
                currentUserId={currentUserId}
                trigger={
                  <Link
                    href={`/profile/${post.user.username}`}
                    className="text-left text-sm font-semibold hover:underline"
                    data-testid="post-author"
                  >
                    {post.user.displayName}
                  </Link>
                }
              />
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
          <p
            className="cursor-pointer whitespace-pre-wrap text-sm"
            data-testid="post-content"
            onClick={handlePostClick}
          >
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
              onClick={handleCommentButtonClick}
              disabled={!currentUserId}
              data-testid="comment-button"
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

          {/* Comment Form */}
          {showCommentForm && (
            <div className="mt-4 space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="min-h-[80px] resize-none"
                  disabled={isSubmittingComment}
                  data-testid="comment-textarea"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || isSubmittingComment}
                    data-testid="comment-submit-button"
                  >
                    {isSubmittingComment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      'Post Comment'
                    )}
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              {comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={comment.user.avatarUrl || ''}
                          alt={comment.user.username}
                        />
                        <AvatarFallback>
                          {comment.user.displayName?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <UserActionMenu
                            userId={comment.user.id}
                            username={comment.user.username}
                            displayName={comment.user.displayName}
                            avatarUrl={comment.user.avatarUrl}
                            currentUserId={currentUserId}
                            trigger={
                              <Link
                                href={`/profile/${comment.user.username}`}
                                className="text-sm font-semibold hover:underline"
                              >
                                {comment.user.displayName}
                              </Link>
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt))} ago
                          </p>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
