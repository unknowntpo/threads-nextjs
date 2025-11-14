'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type FeedTab = 'for-you' | 'following';

export function FeedTabs() {
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');

  return (
    <div className="w-full">
      <div className="flex">
        <button
          onClick={() => setActiveTab('for-you')}
          className={cn(
            'relative flex-1 py-3 text-center text-sm font-medium transition-colors',
            activeTab === 'for-you'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          For you
          {activeTab === 'for-you' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('following')}
          disabled
          className={cn(
            'relative flex-1 py-3 text-center text-sm font-medium transition-colors',
            'cursor-not-allowed text-muted-foreground opacity-50'
          )}
        >
          Following
        </button>
      </div>
    </div>
  );
}
