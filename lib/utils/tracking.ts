/**
 * Client-side tracking utilities
 * Handles batching and throttling of interaction tracking requests
 */

import {
  InteractionType,
  TrackInteractionRequest,
  BatchTrackInteractionRequest,
} from '@/lib/types/tracking';

interface QueuedInteraction {
  post_id: string;
  interaction_type: InteractionType;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

class TrackingService {
  private queue: QueuedInteraction[] = [];
  private batchInterval = 5000; // 5 seconds
  private maxBatchSize = 20;
  private timerId: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Flush queue before page unload
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  /**
   * Track a single interaction
   * Adds to queue and batches automatically
   */
  async track(
    postId: string,
    interactionType: InteractionType,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    this.queue.push({
      post_id: postId,
      interaction_type: interactionType,
      metadata,
      timestamp: Date.now(),
    });

    // If queue exceeds max batch size, flush immediately
    if (this.queue.length >= this.maxBatchSize) {
      await this.flush();
      return;
    }

    // Otherwise, schedule a batch flush
    this.scheduleBatchFlush();
  }

  /**
   * Track multiple interactions immediately
   */
  async trackBatch(interactions: TrackInteractionRequest[]): Promise<void> {
    if (interactions.length === 0) return;

    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interactions,
        } as BatchTrackInteractionRequest),
      });

      if (!response.ok) {
        console.error('Failed to track interactions:', await response.text());
      }
    } catch (error) {
      console.error('Error tracking interactions:', error);
    }
  }

  /**
   * Flush the queue and send all pending interactions
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    // Clear timer
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    // Take all items from queue
    const interactions = this.queue.splice(0, this.queue.length).map(item => ({
      post_id: item.post_id,
      interaction_type: item.interaction_type,
      metadata: item.metadata,
    }));

    await this.trackBatch(interactions);
  }

  private scheduleBatchFlush(): void {
    // Already scheduled
    if (this.timerId) return;

    this.timerId = setTimeout(async () => {
      this.timerId = null;
      await this.flush();
    }, this.batchInterval);
  }

  /**
   * Destroy the tracking service and clear all timers
   * Useful for testing and cleanup
   */
  destroy(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.queue = [];
  }
}

// Singleton instance
export const trackingService = new TrackingService();

// Expose to window for E2E testing
if (typeof window !== 'undefined') {
  (window as unknown as { trackingService: TrackingService }).trackingService = trackingService;
}

/**
 * Track a post view
 */
export function trackView(
  postId: string,
  metadata?: { duration?: number; scroll_depth?: number; source?: string }
) {
  return trackingService.track(postId, 'view', metadata);
}

/**
 * Track a post click
 */
export function trackClick(postId: string, metadata?: { source?: string }) {
  return trackingService.track(postId, 'click', metadata);
}

/**
 * Track a post like
 */
export function trackLike(postId: string, metadata?: { source?: string }) {
  return trackingService.track(postId, 'like', metadata);
}

/**
 * Track a post share
 */
export function trackShare(postId: string, metadata?: { source?: string; method?: string }) {
  return trackingService.track(postId, 'share', metadata);
}
