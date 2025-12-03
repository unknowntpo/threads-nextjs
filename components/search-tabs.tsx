'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type SearchTab = 'top' | 'recent';

interface SearchTabsProps {
  activeTab: SearchTab;
  onTabChange: (tab: SearchTab) => void;
}

export function SearchTabs({ activeTab, onTabChange }: SearchTabsProps) {
  return (
    <div className="mb-4 w-full px-6">
      <div className="flex border-b border-border/40">
        <button
          onClick={() => onTabChange('top')}
          className={cn(
            'relative flex-1 px-4 py-5 text-center text-base font-semibold transition-colors',
            activeTab === 'top' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
          data-testid="search-tab-top"
        >
          Top
          {activeTab === 'top' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground" />
          )}
        </button>
        <button
          onClick={() => onTabChange('recent')}
          className={cn(
            'relative flex-1 px-4 py-5 text-center text-base font-semibold transition-colors',
            activeTab === 'recent'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
          data-testid="search-tab-recent"
        >
          Recent
          {activeTab === 'recent' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}
