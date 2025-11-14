'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type FeedTab = 'for-you' | 'following';

export function FeedTabs() {
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');

  return (
    <div className="mb-4 w-full px-6">
      <div className="flex border-b border-border/40">
        <button
          onClick={() => setActiveTab('for-you')}
          className={cn(
            'relative flex-1 px-4 py-5 text-center text-base font-semibold transition-colors',
            activeTab === 'for-you'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          For you
          {activeTab === 'for-you' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('following')}
          disabled
          className={cn(
            'relative flex-1 px-4 py-5 text-center text-base font-semibold transition-colors',
            'cursor-not-allowed text-muted-foreground opacity-50'
          )}
        >
          Following
        </button>
      </div>
    </div>
  );
}
