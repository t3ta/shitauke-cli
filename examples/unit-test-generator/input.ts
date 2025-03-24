/**
 * Data analytics service that processes user event data.
 * Handles collection, transformation, and reporting of user actions.
 */
export class AnalyticsService {
  /**
   * Creates a new analytics service
   * @param apiClient - Client for sending data to analytics API
   * @param logger - Logging service
   * @param cache - Cache service for temporary storage
   * @param config - Configuration options
   */
  constructor(
    private apiClient: ApiClient,
    private logger: Logger,
    private cache: CacheService,
    private config: AnalyticsConfig
  ) {}

  /**
   * Tracks a user event
   * @param userId - User identifier
   * @param eventType - Type of event
   * @param eventData - Additional event data
   * @returns Promise resolving to true if tracking was successful
   * @throws Error if tracking fails
   */
  async trackEvent(
    userId: string,
    eventType: EventType,
    eventData: Record<string, unknown>
  ): Promise<boolean> {
    try {
      this.logger.debug(`Tracking event ${eventType} for user ${userId}`);
      
      const event: Event = {
        userId,
        type: eventType,
        data: eventData,
        timestamp: new Date().toISOString(),
        sessionId: await this.getSessionId(userId)
      };
      
      // Validate event data
      if (!this.validateEvent(event)) {
        this.logger.warn(`Invalid event data for ${eventType}`);
        return false;
      }
      
      // Apply sampling if configured
      if (this.shouldSampleEvent(event)) {
        await this.cacheEvent(event);
        return true;
      }
      
      // Send to API
      const result = await this.apiClient.sendEvent(event);
      
      if (result.success) {
        this.logger.info(`Successfully tracked ${eventType} for user ${userId}`);
        // Update local event count metrics
        await this.updateEventMetrics(userId, eventType);
        return true;
      } else {
        throw new Error(`API Error: ${result.errorMessage}`);
      }
    } catch (error) {
      this.logger.error(`Failed to track event: ${(error as Error).message}`);
      
      // Store failed events for retry if configured
      if (this.config.storeFailedEvents) {
        await this.storeForRetry(userId, eventType, eventData);
      }
      
      throw error;
    }
  }

  /**
   * Generates an analytics report for a given time period
   * @param startDate - Start of reporting period
   * @param endDate - End of reporting period
   * @param metrics - List of metrics to include
   * @returns Promise resolving to the report object
   */
  async generateReport(
    startDate: Date,
    endDate: Date,
    metrics: MetricType[]
  ): Promise<Report> {
    this.logger.info(`Generating report from ${startDate} to ${endDate}`);
    
    try {
      // Get cached report if exists and valid
      const cachedReport = await this.getReportFromCache(startDate, endDate, metrics);
      if (cachedReport) {
        this.logger.debug('Using cached report');
        return cachedReport;
      }
      
      // Fetch data from API
      const reportData = await this.apiClient.getReportData(startDate, endDate, metrics);
      
      // Process and transform data
      const report = this.processReportData(reportData, metrics);
      
      // Cache for future use
      await this.cacheReport(report, startDate, endDate, metrics);
      
      return report;
    } catch (error) {
      this.logger.error(`Report generation failed: ${(error as Error).message}`);
      throw new Error(`Failed to generate report: ${(error as Error).message}`);
    }
  }

  /**
   * Retries sending failed events
   * @returns Promise resolving to number of successfully retried events
   */
  async retryFailedEvents(): Promise<number> {
    if (!this.config.storeFailedEvents) {
      return 0;
    }
    
    try {
      const failedEvents = await this.getFailedEvents();
      let successCount = 0;
      
      for (const event of failedEvents) {
        try {
          const result = await this.apiClient.sendEvent(event);
          if (result.success) {
            await this.removeFailedEvent(event.userId, event.timestamp);
            successCount++;
          }
        } catch (error) {
          this.logger.debug(`Retry failed for event ${event.type}: ${(error as Error).message}`);
        }
      }
      
      return successCount;
    } catch (error) {
      this.logger.error(`Failed to retry events: ${(error as Error).message}`);
      return 0;
    }
  }

  /**
   * Validates an event object
   * @param event - Event to validate
   * @returns True if the event is valid
   */
  private validateEvent(event: Event): boolean {
    if (!event.userId || !event.type || !event.timestamp) {
      return false;
    }
    
    // Check against allowed event types
    if (!this.config.allowedEventTypes.includes(event.type)) {
      return false;
    }
    
    // Additional validation based on event type
    if (event.type === 'purchase' && !this.validatePurchaseEvent(event.data)) {
      return false;
    }
    
    return true;
  }

  /**
   * Validates purchase event data
   * @param data - Event data
   * @returns True if valid purchase data
   */
  private validatePurchaseEvent(data: Record<string, unknown>): boolean {
    return (
      typeof data.amount === 'number' &&
      data.amount > 0 &&
      typeof data.currency === 'string' &&
      typeof data.productId === 'string'
    );
  }

  /**
   * Determines if an event should be sampled (not sent to API)
   * @param event - Event to check
   * @returns True if the event should be sampled
   */
  private shouldSampleEvent(event: Event): boolean {
    if (!this.config.sampling.enabled) {
      return false;
    }
    
    // Never sample important events
    if (this.config.sampling.excludedEvents.includes(event.type)) {
      return false;
    }
    
    // Sample based on configured rate
    return Math.random() < this.config.sampling.rate;
  }

  /**
   * Gets the current session ID for a user
   * @param userId - User identifier
   * @returns Promise resolving to session ID
   */
  private async getSessionId(userId: string): Promise<string> {
    const cachedSessionId = await this.cache.get(`session:${userId}`);
    if (cachedSessionId) {
      return cachedSessionId as string;
    }
    
    // No active session, create a new one
    const sessionId = this.generateSessionId();
    await this.cache.set(`session:${userId}`, sessionId, this.config.sessionTTL);
    return sessionId;
  }

  /**
   * Generates a new random session ID
   * @returns Session ID string
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Caches an event for later processing
   * @param event - Event to cache
   */
  private async cacheEvent(event: Event): Promise<void> {
    const key = `sampled:${event.userId}:${event.timestamp}`;
    await this.cache.set(key, event, this.config.sampledEventTTL);
  }

  /**
   * Updates metrics for a tracked event
   * @param userId - User identifier
   * @param eventType - Type of event
   */
  private async updateEventMetrics(userId: string, eventType: EventType): Promise<void> {
    const metricKey = `metrics:${eventType}:${new Date().toISOString().split('T')[0]}`;
    const currentCount = await this.cache.get(metricKey) as number || 0;
    await this.cache.set(metricKey, currentCount + 1, 86400); // 24 hours TTL
  }

  /**
   * Stores a failed event for retry
   * @param userId - User identifier
   * @param eventType - Type of event
   * @param eventData - Event data
   */
  private async storeForRetry(
    userId: string,
    eventType: EventType,
    eventData: Record<string, unknown>
  ): Promise<void> {
    const event: Event = {
      userId,
      type: eventType,
      data: eventData,
      timestamp: new Date().toISOString(),
      sessionId: await this.getSessionId(userId),
      retryCount: 0
    };
    
    const key = `retry:${userId}:${event.timestamp}`;
    await this.cache.set(key, event, this.config.retryEventTTL);
  }

  /**
   * Gets failed events for retry
   * @returns Promise resolving to array of failed events
   */
  private async getFailedEvents(): Promise<Event[]> {
    const keys = await this.cache.getKeysByPattern('retry:*');
    const events: Event[] = [];
    
    for (const key of keys) {
      const event = await this.cache.get(key);
      if (event) {
        events.push(event as Event);
      }
    }
    
    return events;
  }

  /**
   * Removes a failed event after successful retry
   * @param userId - User identifier
   * @param timestamp - Event timestamp
   */
  private async removeFailedEvent(userId: string, timestamp: string): Promise<void> {
    const key = `retry:${userId}:${timestamp}`;
    await this.cache.delete(key);
  }

  /**
   * Gets a cached report if available
   * @param startDate - Report start date
   * @param endDate - Report end date
   * @param metrics - Metrics to include
   * @returns Promise resolving to report or null if not cached
   */
  private async getReportFromCache(
    startDate: Date,
    endDate: Date,
    metrics: MetricType[]
  ): Promise<Report | null> {
    const key = this.getReportCacheKey(startDate, endDate, metrics);
    const cachedReport = await this.cache.get(key);
    return cachedReport ? cachedReport as Report : null;
  }

  /**
   * Processes raw report data into structured report
   * @param data - Raw report data
   * @param metrics - Metrics to include
   * @returns Structured report
   */
  private processReportData(data: ReportData, metrics: MetricType[]): Report {
    const report: Report = {
      generatedAt: new Date().toISOString(),
      timeRange: {
        start: data.startDate,
        end: data.endDate
      },
      metrics: {}
    };
    
    for (const metric of metrics) {
      if (data.metrics[metric]) {
        report.metrics[metric] = data.metrics[metric];
      }
    }
    
    return report;
  }

  /**
   * Caches a generated report
   * @param report - Report to cache
   * @param startDate - Report start date
   * @param endDate - Report end date
   * @param metrics - Metrics included
   */
  private async cacheReport(
    report: Report,
    startDate: Date,
    endDate: Date,
    metrics: MetricType[]
  ): Promise<void> {
    const key = this.getReportCacheKey(startDate, endDate, metrics);
    await this.cache.set(key, report, this.config.reportCacheTTL);
  }

  /**
   * Generates a cache key for a report
   * @param startDate - Report start date
   * @param endDate - Report end date
   * @param metrics - Metrics included
   * @returns Cache key
   */
  private getReportCacheKey(
    startDate: Date,
    endDate: Date,
    metrics: MetricType[]
  ): string {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    const metricsStr = metrics.sort().join(':');
    return `report:${startStr}:${endStr}:${metricsStr}`;
  }
}

// Types
export interface ApiClient {
  sendEvent(event: Event): Promise<ApiResponse>;
  getReportData(
    startDate: Date,
    endDate: Date,
    metrics: MetricType[]
  ): Promise<ReportData>;
}

export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export interface CacheService {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  getKeysByPattern(pattern: string): Promise<string[]>;
}

export interface AnalyticsConfig {
  allowedEventTypes: EventType[];
  storeFailedEvents: boolean;
  retryEventTTL: number;
  sampledEventTTL: number;
  sessionTTL: number;
  reportCacheTTL: number;
  sampling: {
    enabled: boolean;
    rate: number;
    excludedEvents: EventType[];
  };
}

export type EventType = 'pageview' | 'click' | 'purchase' | 'signup' | 'login';
export type MetricType = 'dailyActiveUsers' | 'conversions' | 'revenue' | 'sessionDuration';

export interface Event {
  userId: string;
  type: EventType;
  data: Record<string, unknown>;
  timestamp: string;
  sessionId: string;
  retryCount?: number;
}

export interface ApiResponse {
  success: boolean;
  errorMessage?: string;
}

export interface ReportData {
  startDate: string;
  endDate: string;
  metrics: {
    [key in MetricType]?: any;
  };
}

export interface Report {
  generatedAt: string;
  timeRange: {
    start: string;
    end: string;
  };
  metrics: {
    [key in MetricType]?: any;
  };
}
