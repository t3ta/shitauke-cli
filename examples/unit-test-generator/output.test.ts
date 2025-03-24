import { AnalyticsService, ApiClient, Logger, CacheService, AnalyticsConfig, EventType, MetricType, Event, ApiResponse, ReportData, Report } from './advanced-input';

jest.mock('./advanced-input');

describe('AnalyticsService', () => {
  let apiClientMock: jest.Mocked<ApiClient>;
  let loggerMock: jest.Mocked<Logger>;
  let cacheServiceMock: jest.Mocked<CacheService>;
  let config: AnalyticsConfig;
  let analyticsService: AnalyticsService;

  const now = new Date('2024-01-01T00:00:00.000Z');
  const userId = 'testUser';
  const eventType: EventType = 'click';
  const eventData = { key: 'value' };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock dependencies
    apiClientMock = {
      sendEvent: jest.fn(),
      getReportData: jest.fn(),
    } as jest.Mocked<ApiClient>;

    loggerMock = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as jest.Mocked<Logger>;

    cacheServiceMock = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      getKeysByPattern: jest.fn(),
    } as jest.Mocked<CacheService>;

    config = {
      allowedEventTypes: ['click', 'purchase'],
      storeFailedEvents: true,
      retryEventTTL: 3600,
      sampledEventTTL: 600,
      sessionTTL: 1800,
      reportCacheTTL: 7200,
      sampling: {
        enabled: true,
        rate: 0.5,
        excludedEvents: ['purchase'],
      },
    };

    // Mock Date.now and toISOString for predictable timestamps
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(now.toISOString());

    // Mock Math.random for predictable sampling
    jest.spyOn(Math, 'random').mockReturnValue(0.3);

    analyticsService = new AnalyticsService(apiClientMock, loggerMock, cacheServiceMock, config);
  });

  describe('trackEvent', () => {
    describe('when tracking is successful', () => {
      it('should send the event to the API and return true', async () => {
        // Arrange
        apiClientMock.sendEvent.mockResolvedValue({ success: true });
        cacheServiceMock.get.mockResolvedValue('sessionId');

        // Act
        const result = await analyticsService.trackEvent(userId, eventType, eventData);

        // Assert
        expect(result).toBe(true);
        expect(apiClientMock.sendEvent).toHaveBeenCalledWith({
          userId: userId,
          type: eventType,
          data: eventData,
          timestamp: now.toISOString(),
          sessionId: 'sessionId'
        });
        expect(loggerMock.info).toHaveBeenCalledWith(`Successfully tracked ${eventType} for user ${userId}`);
        expect(cacheServiceMock.set).toHaveBeenCalled();
      });
    });

    describe('when the API returns an error', () => {
      it('should log an error, store the event for retry (if configured), and re-throw the error', async () => {
        // Arrange
        const errorMessage = 'API Error';
        apiClientMock.sendEvent.mockResolvedValue({ success: false, errorMessage });
        cacheServiceMock.get.mockResolvedValue('sessionId');

        // Act & Assert
        await expect(analyticsService.trackEvent(userId, eventType, eventData)).rejects.toThrow(errorMessage);
        expect(loggerMock.error).toHaveBeenCalledWith(`Failed to track event: API Error`);
        expect(cacheServiceMock.set).toHaveBeenCalledWith(expect.stringContaining('retry:'), expect.anything(), config.retryEventTTL);
      });
    });

    describe('when event data is invalid', () => {
      it('should log a warning and return false', async () => {
        // Arrange
        const invalidEventData = {};
        const validateEventSpy = jest.spyOn(analyticsService as any, 'validateEvent').mockReturnValue(false);

        // Act
        const result = await analyticsService.trackEvent(userId, eventType, invalidEventData);

        // Assert
        expect(result).toBe(false);
        expect(loggerMock.warn).toHaveBeenCalledWith(`Invalid event data for ${eventType}`);
        expect(apiClientMock.sendEvent).not.toHaveBeenCalled();
        validateEventSpy.mockRestore();
      });
    });

    describe('when sampling is enabled and the event should be sampled', () => {
      it('should cache the event and return true', async () => {
        // Arrange
        jest.spyOn(analyticsService as any, 'shouldSampleEvent').mockReturnValue(true);
        cacheServiceMock.get.mockResolvedValue('sessionId');

        // Act
        const result = await analyticsService.trackEvent(userId, eventType, eventData);

        // Assert
        expect(result).toBe(true);
        expect(cacheServiceMock.set).toHaveBeenCalledWith(expect.stringContaining('sampled:'), expect.anything(), config.sampledEventTTL);
        expect(apiClientMock.sendEvent).not.toHaveBeenCalled();
      });
    });
  });

  describe('generateReport', () => {
    const startDate = new Date('2023-01-01T00:00:00.000Z');
    const endDate = new Date('2023-01-02T00:00:00.000Z');
    const metrics: MetricType[] = ['dailyActiveUsers', 'revenue'];

    describe('when a valid report is found in the cache', () => {
      it('should return the cached report', async () => {
        // Arrange
        const cachedReport: Report = {
          generatedAt: now.toISOString(),
          timeRange: { start: startDate.toISOString(), end: endDate.toISOString() },
          metrics: { dailyActiveUsers: 100, revenue: 500 }
        };
        cacheServiceMock.get.mockResolvedValue(cachedReport);

        // Act
        const report = await analyticsService.generateReport(startDate, endDate, metrics);

        // Assert
        expect(report).toEqual(cachedReport);
        expect(cacheServiceMock.get).toHaveBeenCalledWith(expect.stringContaining('report:'));
        expect(apiClientMock.getReportData).not.toHaveBeenCalled();
      });
    });

    describe('when no report is found in the cache', () => {
      it('should fetch report data from the API, process it, cache it, and return it', async () => {
        // Arrange
        cacheServiceMock.get.mockResolvedValue(null);
        const reportData: ReportData = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          metrics: { dailyActiveUsers: 200, revenue: 1000 }
        };
        apiClientMock.getReportData.mockResolvedValue(reportData);

        // Act
        const report = await analyticsService.generateReport(startDate, endDate, metrics);

        // Assert
        expect(apiClientMock.getReportData).toHaveBeenCalledWith(startDate, endDate, metrics);
        expect(cacheServiceMock.set).toHaveBeenCalledWith(expect.stringContaining('report:'), expect.anything(), config.reportCacheTTL);
        expect(report.metrics).toEqual(reportData.metrics);
      });
    });

    describe('when fetching report data from the API fails', () => {
      it('should log an error and re-throw the error', async () => {
        // Arrange
        cacheServiceMock.get.mockResolvedValue(null);
        const errorMessage = 'API Error';
        apiClientMock.getReportData.mockRejectedValue(new Error(errorMessage));

        // Act & Assert
        await expect(analyticsService.generateReport(startDate, endDate, metrics)).rejects.toThrow(errorMessage);
        expect(loggerMock.error).toHaveBeenCalledWith(`Report generation failed: ${errorMessage}`);
      });
    });
  });

  describe('retryFailedEvents', () => {
    describe('when storeFailedEvents is disabled', () => {
      it('should return 0', async () => {
        // Arrange
        config.storeFailedEvents = false;
        analyticsService = new AnalyticsService(apiClientMock, loggerMock, cacheServiceMock, config);

        // Act
        const result = await analyticsService.retryFailedEvents();

        // Assert
        expect(result).toBe(0);
        expect(cacheServiceMock.getKeysByPattern).not.toHaveBeenCalled();
      });
    });

    describe('when there are failed events to retry', () => {
      it('should retry each event and remove it from the cache if successful', async () => {
        // Arrange
        const failedEvent1: Event = { userId: 'user1', type: 'click', data: {}, timestamp: now.toISOString(), sessionId: 'session1' };
        const failedEvent2: Event = { userId: 'user2', type: 'purchase', data: {}, timestamp: now.toISOString(), sessionId: 'session2' };
        cacheServiceMock.getKeysByPattern.mockResolvedValue(['retry:user1:timestamp1', 'retry:user2:timestamp2']);
        cacheServiceMock.get.mockResolvedValueOnce(failedEvent1).mockResolvedValueOnce(failedEvent2);
        apiClientMock.sendEvent.mockResolvedValue({ success: true });

        // Act
        const successCount = await analyticsService.retryFailedEvents();

        // Assert
        expect(successCount).toBe(2);
        expect(apiClientMock.sendEvent).toHaveBeenCalledTimes(2);
        expect(cacheServiceMock.delete).toHaveBeenCalledTimes(2);
      });

      it('should log an error if retrying an event fails but continue retrying other events', async () => {
        // Arrange
        const failedEvent1: Event = { userId: 'user1', type: 'click', data: {}, timestamp: now.toISOString(), sessionId: 'session1' };
        const failedEvent2: Event = { userId: 'user2', type: 'purchase', data: {}, timestamp: now.toISOString(), sessionId: 'session2' };
        cacheServiceMock.getKeysByPattern.mockResolvedValue(['retry:user1:timestamp1', 'retry:user2:timestamp2']);
        cacheServiceMock.get.mockResolvedValueOnce(failedEvent1).mockResolvedValueOnce(failedEvent2);
        apiClientMock.sendEvent.mockRejectedValueOnce(new Error('Retry Failed')).mockResolvedValue({ success: true });

        // Act
        const successCount = await analyticsService.retryFailedEvents();

        // Assert
        expect(successCount).toBe(1);
        expect(apiClientMock.sendEvent).toHaveBeenCalledTimes(2);
        expect(loggerMock.debug).toHaveBeenCalledWith(expect.stringContaining('Retry failed for event click:'));
        expect(cacheServiceMock.delete).toHaveBeenCalledTimes(1);
      });
    });

    describe('when getting failed events fails', () => {
      it('should log an error and return 0', async () => {
        // Arrange
        cacheServiceMock.getKeysByPattern.mockRejectedValue(new Error('Cache Error'));

        // Act
        const successCount = await analyticsService.retryFailedEvents();

        // Assert
        expect(successCount).toBe(0);
        expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining('Failed to retry events:'));
      });
    });
  });

  describe('private methods', () => {
    describe('validateEvent', () => {
      it('should return false if userId, type, or timestamp is missing', () => {
        const event1: Event = { userId: '', type: 'click', data: {}, timestamp: now.toISOString(), sessionId: 'session1' };
        const event2: Event = { userId: 'user1', type: '' as EventType, data: {}, timestamp: now.toISOString(), sessionId: 'session1' };
        const event3: Event = { userId: 'user1', type: 'click', data: {}, timestamp: '', sessionId: 'session1' };

        expect((analyticsService as any).validateEvent(event1)).toBe(false);
        expect((analyticsService as any).validateEvent(event2)).toBe(false);
        expect((analyticsService as any).validateEvent(event3)).toBe(false);
      });

      it('should return false if the event type is not allowed', () => {
        const event: Event = { userId: 'user1', type: 'signup', data: {}, timestamp: now.toISOString(), sessionId: 'session1' };
        expect((analyticsService as any).validateEvent(event)).toBe(false);
      });

      it('should return false for invalid purchase event data', () => {
        const event: Event = { userId: 'user1', type: 'purchase', data: { amount: -1, currency: 'USD', productId: '123' }, timestamp: now.toISOString(), sessionId: 'session1' };
        expect((analyticsService as any).validateEvent(event)).toBe(false);
      });

      it('should return true for valid events', () => {
        const event1: Event = { userId: 'user1', type: 'click', data: {}, timestamp: now.toISOString(), sessionId: 'session1' };
        const event2: Event = { userId: 'user1', type: 'purchase', data: { amount: 10, currency: 'USD', productId: '123' }, timestamp: now.toISOString(), sessionId: 'session1' };
        expect((analyticsService as any).validateEvent(event1)).toBe(true);
        expect((analyticsService as any).validateEvent(event2)).toBe(true);
      });
    });

    describe('validatePurchaseEvent', () => {
      it('should return true if the purchase event data is valid', () => {
        const data = { amount: 10, currency: 'USD', productId: '123' };
        expect((analyticsService as any).validatePurchaseEvent(data)).toBe(true);
      });

      it('should return false if the purchase event data is invalid', () => {
        expect((analyticsService as any).validatePurchaseEvent({ amount: -1, currency: 'USD', productId: '123' })).toBe(false);
        expect((analyticsService as any).validatePurchaseEvent({ amount: 10, currency: 123, productId: '123' })).toBe(false);
        expect((analyticsService as any).validatePurchaseEvent({ amount: 10, currency: 'USD', productId: 123 })).toBe(false);
      });
    });

    describe('shouldSampleEvent', () => {
      it('should return false if sampling is disabled', () => {
        config.sampling.enabled = false;
        analyticsService = new AnalyticsService(apiClientMock, loggerMock, cacheServiceMock, config);
        const event: Event = { userId: 'user1', type: 'click', data: {}, timestamp: now.toISOString(), sessionId: 'session1' };
        expect((analyticsService as any).shouldSampleEvent(event)).toBe(false);
      });

      it('should return false if the event type is excluded from sampling', () => {
        const event: Event = { userId: 'user1', type: 'purchase', data: {}, timestamp: now.toISOString(), sessionId: 'session1' };
        expect((analyticsService as any).shouldSampleEvent(event)).toBe(false);
      });

      it('should sample based on the configured rate', () => {
        const event: Event = { userId: 'user1', type: 'click', data: {}, timestamp: now.toISOString(), sessionId: 'session1' };
        expect((analyticsService as any).shouldSampleEvent(event)).toBe(true); // Mocked Math.random returns 0.3, which is less than 0.5
      });
    });

    describe('getSessionId', () => {
      it('should return the cached session ID if it exists', async () => {
        cacheServiceMock.get.mockResolvedValue('cachedSessionId');
        const sessionId = await (analyticsService as any).getSessionId(userId);
        expect(sessionId).toBe('cachedSessionId');
        expect(cacheServiceMock.set).not.toHaveBeenCalled();
      });

      it('should generate a new session ID, cache it, and return it if it does not exist in cache', async () => {
        cacheServiceMock.get.mockResolvedValue(null);
        const generateSessionIdSpy = jest.spyOn(analyticsService as any, 'generateSessionId').mockReturnValue('newSessionId');
        const sessionId = await (analyticsService as any).getSessionId(userId);
        expect(sessionId).toBe('newSessionId');
        expect(cacheServiceMock.set).toHaveBeenCalledWith(`session:${userId}`, 'newSessionId', config.sessionTTL);
        generateSessionIdSpy.mockRestore();
      });
    });

    describe('generateSessionId', () => {
      it('should generate a session ID', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.5);
        const sessionId = (analyticsService as any).generateSessionId();
        expect(sessionId).toBe('1lbq40u8ko');
      });
    });

    describe('cacheEvent', () => {
      it('should cache the event with the correct key and TTL', async () => {
        const event: Event = { userId: 'user1', type: 'click', data: {}, timestamp: now.toISOString(), sessionId: 'session1' };
        await (analyticsService as any).cacheEvent(event);
        expect(cacheServiceMock.set).toHaveBeenCalledWith(`sampled:${event.userId}:${event.timestamp}`, event, config.sampledEventTTL);
      });
    });

    describe('updateEventMetrics', () => {
      it('should update the event metrics in the cache', async () => {
        cacheServiceMock.get.mockResolvedValue(5);
        await (analyticsService as any).updateEventMetrics(userId, eventType);
        expect(cacheServiceMock.set).toHaveBeenCalledWith(`metrics:${eventType}:2024-01-01`, 6, 86400);
      });

      it('should initialize the event metrics in the cache if they do not exist', async () => {
        cacheServiceMock.get.mockResolvedValue(null);
        await (analyticsService as any).updateEventMetrics(userId, eventType);
        expect(cacheServiceMock.set).toHaveBeenCalledWith(`metrics:${eventType}:2024-01-01`, 1, 86400);
      });
    });

    describe('storeForRetry', () => {
      it('should store the event for retry with the correct key and TTL', async () => {
        cacheServiceMock.get.mockResolvedValue('sessionId');
        const eventData = { some: 'data' };
        await (analyticsService as any).storeForRetry(userId, eventType, eventData);

        expect(cacheServiceMock.set).toHaveBeenCalledWith(expect.stringContaining('retry:'), expect.anything(), config.retryEventTTL);
      });
    });

    describe('getFailedEvents', () => {
      it('should return an array of failed events', async () => {
        cacheServiceMock.getKeysByPattern.mockResolvedValue(['retry:user1:timestamp1', 'retry:user2:timestamp2']);
        const failedEvent1: Event = { userId: 'user1', type: 'click', data: {}, timestamp: now.toISOString(), sessionId: 'session1' };
        const failedEvent2: Event = { userId: 'user2', type: 'purchase', data: {}, timestamp: now.toISOString(), sessionId: 'session2' };
        cacheServiceMock.get.mockResolvedValueOnce(failedEvent1).mockResolvedValueOnce(failedEvent2);

        const failedEvents = await (analyticsService as any).getFailedEvents();

        expect(failedEvents).toEqual([failedEvent1, failedEvent2]);
      });
    });

    describe('removeFailedEvent', () => {
      it('should remove a failed event from the cache', async () => {
        const timestamp = now.toISOString();
        await (analyticsService as any).removeFailedEvent(userId, timestamp);
        expect(cacheServiceMock.delete).toHaveBeenCalledWith(`retry:${userId}:${timestamp}`);
      });
    });

    describe('getReportFromCache', () => {
      it('should return the cached report if it exists', async () => {
        const startDate = new Date('2023-01-01T00:00:00.000Z');
        const endDate = new Date('2023-01-02T00:00:00.000Z');
        const metrics: MetricType[] = ['dailyActiveUsers', 'revenue'];
        const cachedReport: Report = {
          generatedAt: now.toISOString(),
          timeRange: { start: startDate.toISOString(), end: endDate.toISOString() },
          metrics: { dailyActiveUsers: 100, revenue: 500 }
        };
        cacheServiceMock.get.mockResolvedValue(cachedReport);

        const report = await (analyticsService as any).getReportFromCache(startDate, endDate, metrics);

        expect(report).toEqual(cachedReport);
      });

      it('should return null if the report does not exist in the cache', async () => {
        const startDate = new Date('2023-01-01T00:00:00.000Z');
        const endDate = new Date('2023-01-02T00:00:00.000Z');
        const metrics: MetricType[] = ['dailyActiveUsers', 'revenue'];
        cacheServiceMock.get.mockResolvedValue(null);

        const report = await (analyticsService as any).getReportFromCache(startDate, endDate, metrics);

        expect(report).toBeNull();
      });
    });

    describe('processReportData', () => {
      it('should process the report data and return a report object', () => {
        const startDate = now.toISOString();
        const endDate = now.toISOString();
        const metrics: MetricType[] = ['dailyActiveUsers', 'revenue'];
        const data: ReportData = {
          startDate,
          endDate,
          metrics: { dailyActiveUsers: 100, revenue: 500, sessionDuration: 120 }
        };
        const report: Report = (analyticsService as any).processReportData(data, metrics);

        expect(report.timeRange.start).toBe(startDate);
        expect(report.timeRange.end).toBe(endDate);
        expect(report.metrics.dailyActiveUsers).toBe(100);
        expect(report.metrics.revenue).toBe(500);
        expect(report.metrics.sessionDuration).toBeUndefined();
      });
    });

    describe('cacheReport', () => {
      it('should cache the report with the correct key and TTL', async () => {
        const startDate = new Date('2023-01-01T00:00:00.000Z');
        const endDate = new Date('2023-01-02T00:00:00.000Z');
        const metrics: MetricType[] = ['dailyActiveUsers', 'revenue'];
        const report: Report = {
          generatedAt: now.toISOString(),
          timeRange: { start: startDate.toISOString(), end: endDate.toISOString() },
          metrics: { dailyActiveUsers: 100, revenue: 500 }
        };

        await (analyticsService as any).cacheReport(report, startDate, endDate, metrics);

        expect(cacheServiceMock.set).toHaveBeenCalledWith(expect.stringContaining('report:'), report, config.reportCacheTTL);
      });
    });

    describe('getReportCacheKey', () => {
      it('should generate the correct cache key', () => {
        const startDate = new Date('2023-01-01T00:00:00.000Z');
        const endDate = new Date('2023-01-02T00:00:00.000Z');
        const metrics: MetricType[] = ['dailyActiveUsers', 'revenue'];
        const key = (analyticsService as any).getReportCacheKey(startDate, endDate, metrics);
        expect(key).toBe('report:2023-01-01:2023-01-02:dailyActiveUsers:revenue');
      });
    });
  });
});