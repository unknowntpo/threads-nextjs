'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, ImagePlus, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { CreatePostDTO, PostWithProfile } from '@/lib/types/entities'

interface CreatePostFormProps {
  onPostCreated?: (post: PostWithProfile) => void
}

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [showImageInput, setShowImageInput] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some content for your post',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const postData: CreatePostDTO = {
        content: content.trim(),
        ...(imageUrl.trim() && { image_url: imageUrl.trim() }),
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post')
      }

      // Reset form
      setContent('')
      setImageUrl('')
      setShowImageInput(false)

      // Call callback if provided
      onPostCreated?.(data.post)

      toast({
        title: 'Success',
        description: 'Your post has been created!',
      })
    } catch (error) {
      console.error('Error creating post:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create post',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const removeImage = () => {
    setImageUrl('')
    setShowImageInput(false)
  }

  const remainingChars = 500 - content.length

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create a Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">What&apos;s on your mind?</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Share your thoughts..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={500}
              disabled={loading}
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{remainingChars} characters remaining</span>
            </div>
          </div>

          {showImageInput && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="image-url">Image URL (optional)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeImage}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                id="image-url"
                name="image_url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                disabled={loading}
              />
              {imageUrl && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-h-40 rounded-lg border"
                    onError={() => {
                      toast({
                        title: 'Invalid Image',
                        description: 'The image URL appears to be invalid',
                        variant: 'destructive',
                      })
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {!showImageInput && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImageInput(true)}
                  disabled={loading}
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Add Image
                </Button>
              )}
            </div>

            <Button type="submit" disabled={loading || !content.trim() || remainingChars < 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
