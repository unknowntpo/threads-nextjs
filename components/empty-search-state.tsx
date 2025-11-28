'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface EmptySearchStateProps {
  query?: string;
}

export function EmptySearchState({ query }: EmptySearchStateProps) {
  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">Search for posts</h3>
        <p className="text-sm text-muted-foreground">Enter a keyword to find relevant posts</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Search className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-semibold">No results found</h3>
      <p className="text-sm text-muted-foreground">
        No posts match &quot;{query}&quot;. Try different keywords.
      </p>
    </div>
  );
}
