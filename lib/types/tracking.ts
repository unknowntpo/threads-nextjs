/**
 * Types for user interaction tracking system
 */

export type InteractionType = 'view' | 'click' | 'like' | 'share';

export interface InteractionMetadata {
  duration?: number; // Duration in milliseconds (for views)
  scroll_depth?: number; // Scroll depth percentage (for views)
  source?: string; // Source of interaction (e.g., 'feed', 'profile', 'search')
  [key: string]: unknown; // Allow additional metadata
}

export interface TrackInteractionRequest {
  post_id: string;
  interaction_type: InteractionType;
  metadata?: InteractionMetadata;
}

export interface BatchTrackInteractionRequest {
  interactions: TrackInteractionRequest[];
}

export interface TrackInteractionResponse {
  success: boolean;
  tracked: number;
  errors?: string[];
}
