/**
 * React hooks for tracking post interactions
 */

import { useEffect, useRef, useState } from 'react';
import { trackView } from '@/lib/utils/tracking';

interface UsePostViewTrackingOptions {
  postId: string;
  threshold?: number; // Percentage of post visible to trigger view (0-1)
  minDuration?: number; // Minimum time in view to count (ms)
  source?: string;
}

/**
 * Hook to track post views using Intersection Observer
 * Tracks when post is visible and records view duration
 */
export function usePostViewTracking({
  postId,
  threshold = 0.5,
  minDuration = 1000,
  source = 'feed',
}: UsePostViewTrackingOptions) {
  const elementRef = useRef<HTMLDivElement>(null);
  const viewStartTimeRef = useRef<number | null>(null);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Post entered viewport
            viewStartTimeRef.current = Date.now();
          } else {
            // Post left viewport
            if (viewStartTimeRef.current && !hasTrackedRef.current) {
              const duration = Date.now() - viewStartTimeRef.current;

              // Only track if viewed for minimum duration
              if (duration >= minDuration) {
                trackView(postId, {
                  duration,
                  scroll_depth: Math.round(entry.intersectionRatio * 100),
                  source,
                });
                hasTrackedRef.current = true;
              }
            }
            viewStartTimeRef.current = null;
          }
        });
      },
      {
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      // Track final view on unmount if still viewing
      if (viewStartTimeRef.current && !hasTrackedRef.current) {
        const duration = Date.now() - viewStartTimeRef.current;
        if (duration >= minDuration) {
          trackView(postId, {
            duration,
            scroll_depth: 100,
            source,
          });
          hasTrackedRef.current = true;
        }
      }
      observer.disconnect();
    };
  }, [postId, threshold, minDuration, source]);

  return elementRef;
}

interface UseScrollDepthOptions {
  onScrollDepthChange?: (depth: number) => void;
}

/**
 * Hook to track scroll depth within an element
 */
export function useScrollDepth({ onScrollDepthChange }: UseScrollDepthOptions = {}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [scrollDepth, setScrollDepth] = useState(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;

      if (scrollHeight - clientHeight === 0) {
        setScrollDepth(100);
        onScrollDepthChange?.(100);
        return;
      }

      const depth = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      setScrollDepth(depth);
      onScrollDepthChange?.(depth);
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [onScrollDepthChange]);

  return { elementRef, scrollDepth };
}
