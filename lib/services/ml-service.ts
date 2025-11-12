import { logger } from '@/lib/logger';

/**
 * ML Service Client
 * Handles communication with FastAPI ML recommendation service
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export interface RecommendationItem {
  post_id: string;
  score: number;
  reason: string;
}

export interface GenerateRecommendationsRequest {
  user_id: string;
  limit: number;
  exclude_post_ids?: string[];
}

export interface GenerateRecommendationsResponse {
  user_id: string;
  recommendations: RecommendationItem[];
  count: number;
  model_version: string;
}

export class MLServiceClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string = ML_SERVICE_URL, timeout: number = 5000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  /**
   * Generate personalized recommendations for user
   *
   * @param userId - User ID to generate recommendations for
   * @param limit - Maximum number of recommendations (1-100)
   * @param excludePostIds - Post IDs to exclude from recommendations
   * @returns ML recommendations or null if service fails
   */
  async generateRecommendations(
    userId: string,
    limit: number = 50,
    excludePostIds: string[] = []
  ): Promise<GenerateRecommendationsResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/recommendations/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          limit,
          exclude_post_ids: excludePostIds,
        } as GenerateRecommendationsRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.error('ML Service error', {
          status: response.status,
          statusText: response.statusText,
        });
        return null;
      }

      const data = (await response.json()) as GenerateRecommendationsResponse;

      logger.info('ML Service success', {
        userId,
        recommendationCount: data.count,
        modelVersion: data.model_version,
      });

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          logger.error('ML Service timeout', { userId, timeout: this.timeout });
        } else {
          logger.error('ML Service connection error', { userId, error: error.message });
        }
      }
      return null;
    }
  }

  /**
   * Check if ML service is healthy
   *
   * @returns true if service is healthy, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout for health

      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return response.ok;
    } catch (error) {
      logger.error('ML Service health check failed', { error });
      return false;
    }
  }
}

// Singleton instance
export const mlServiceClient = new MLServiceClient();
