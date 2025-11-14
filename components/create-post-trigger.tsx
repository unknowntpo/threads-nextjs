'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreatePostForm } from '@/components/create-post-form';

export function CreatePostTrigger() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  const handlePostCreated = () => {
    setOpen(false);
    // Refresh page to show new post
    window.location.reload();
  };

  return (
    <>
      <Card
        className="w-full cursor-pointer transition-colors hover:bg-accent/50"
        onClick={() => setOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={session?.user?.image || ''} alt="Your avatar" />
              <AvatarFallback>{session?.user?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left text-sm text-muted-foreground">Start a thread...</div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create a Post</DialogTitle>
          </DialogHeader>
          <CreatePostForm onPostCreated={handlePostCreated} asDialog />
        </DialogContent>
      </Dialog>
    </>
  );
}
