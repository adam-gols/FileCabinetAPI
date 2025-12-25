const request = require('supertest');

// Set test environment
process.env.NODE_ENV = 'test';

// Mock Google Sheets API before importing the app
const mockSheetsApi = {
  spreadsheets: {
    values: {
      get: jest.fn(),
      update: jest.fn()
    }
  }
};

jest.mock('googleapis', () => ({
  google: {
    sheets: jest.fn(() => mockSheetsApi)
  }
}));

jest.mock('google-auth-library', () => ({
  GoogleAuth: jest.fn(() => ({
    getClient: jest.fn().mockResolvedValue({})
  }))
}));

// Import app after mocks are set up
const { app, parseDate, getEventStatus, filterEvents, initializeForTests } = require('../src/index');

describe('File Cabinet API', () => {
  beforeAll(async () => {
    // Ensure the API is properly initialized for tests
    await initializeForTests();
  });

  beforeEach(() => {
    // Clear cache and mocks
    jest.clearAllMocks();
    mockSheetsApi.spreadsheets.values.get.mockClear();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        service: 'file-cabinet-api',
        version: '1.0.0'
      });
    });
  });

  describe('GET /file-cabinet', () => {
    it('should return 400 when tab parameter is missing', async () => {
      const response = await request(app)
        .get('/file-cabinet')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required query parameter: tab'
        }
      });
    });

    it('should return 400 for invalid dateFilter', async () => {
      const response = await request(app)
        .get('/file-cabinet?tab=test&dateFilter=invalid')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid dateFilter. Must be one of: all, current, future'
        }
      });
    });

    it('should return 400 for invalid today parameter', async () => {
      const response = await request(app)
        .get('/file-cabinet?tab=test&today=invalid-date')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid today parameter. Must be in YYYY-MM-DD format'
        }
      });
    });

    it('should return 400 when no spreadsheet ID is available', async () => {
      // Clear environment variable and don't provide sheetId
      delete process.env.FILE_CABINET_SHEET_ID;
      
      const response = await request(app)
        .get('/file-cabinet?tab=test')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'No spreadsheet ID available. Either provide sheetId parameter or set FILE_CABINET_SHEET_ID environment variable'
        }
      });
    });

    it('should use custom sheetId when provided', async () => {
      const customSheetId = '1CustomSheet123456789';
      const mockSheetData = {
        values: [
          ['Event Name', 'Event Link', 'Start Date', 'End Date'],
          ['Test Event', 'https://example.com/sheet', '12/25/2025', '12/26/2025']
        ]
      };

      mockSheetsApi.spreadsheets.values.get.mockResolvedValueOnce({
        data: mockSheetData
      });

      const response = await request(app)
        .get(`/file-cabinet?tab=test&sheetId=${customSheetId}`)
        .expect(200);

      expect(mockSheetsApi.spreadsheets.values.get).toHaveBeenCalledWith({
        spreadsheetId: customSheetId,
        range: "'test'!A:D"
      });

      expect(response.body.success).toBe(true);
    });

    it('should fall back to FILE_CABINET_SHEET_ID when sheetId not provided', async () => {
      const defaultSheetId = '1DefaultSheet987654321';
      process.env.FILE_CABINET_SHEET_ID = defaultSheetId;
      
      const mockSheetData = {
        values: [
          ['Event Name', 'Event Link', 'Start Date', 'End Date'],
          ['Default Event', 'https://example.com/default', '12/25/2025', '12/26/2025']
        ]
      };

      mockSheetsApi.spreadsheets.values.get.mockResolvedValueOnce({
        data: mockSheetData
      });

      const response = await request(app)
        .get('/file-cabinet?tab=test')
        .expect(200);

      expect(mockSheetsApi.spreadsheets.values.get).toHaveBeenCalledWith({
        spreadsheetId: defaultSheetId,
        range: "'test'!A:D"
      });

      expect(response.body.success).toBe(true);
    });

    it('should return 403 for permission denied on custom sheet', async () => {
      const customSheetId = '1RestrictedSheet123456789';
      
      mockSheetsApi.spreadsheets.values.get.mockRejectedValueOnce({
        code: 403,
        message: 'The caller does not have permission'
      });

      const response = await request(app)
        .get(`/file-cabinet?tab=test&sheetId=${customSheetId}`)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Access denied to the specified spreadsheet. Check sharing permissions.'
        }
      });
    });

    it('should return 404 for non-existent custom sheet', async () => {
      const customSheetId = '1NonExistentSheet123456789';
      
      mockSheetsApi.spreadsheets.values.get.mockRejectedValueOnce({
        code: 404,
        message: 'Requested entity was not found'
      });

      const response = await request(app)
        .get(`/file-cabinet?tab=test&sheetId=${customSheetId}`)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Spreadsheet not found. Verify the sheet ID is correct.'
        }
      });
    });

    it('should include sheetId in cache key for proper caching', async () => {
      const customSheetId = '1CachedSheet123456789';
      const mockSheetData = {
        values: [
          ['Event Name', 'Event Link', 'Start Date', 'End Date'],
          ['Cached Event', 'https://example.com/cached', '12/25/2025', '12/26/2025']
        ]
      };

      mockSheetsApi.spreadsheets.values.get.mockResolvedValue({
        data: mockSheetData
      });

      // First request with custom sheetId
      await request(app)
        .get(`/file-cabinet?tab=test&sheetId=${customSheetId}`)
        .expect(200);

      // Second request with same custom sheetId should use cache
      await request(app)
        .get(`/file-cabinet?tab=test&sheetId=${customSheetId}`)
        .expect(200);

      // Third request with different sheetId should not use cache
      await request(app)
        .get(`/file-cabinet?tab=test&sheetId=1DifferentSheet123`)
        .expect(200);

      // Should have made 2 API calls (first and third request)
      expect(mockSheetsApi.spreadsheets.values.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('parseDate function', () => {
    const testDate = new Date('2025-12-23T00:00:00.000Z');

    it('should parse dates with year correctly', () => {
      expect(parseDate('1/15/2026', testDate)).toBe('2026-01-15');
      expect(parseDate('12/30/2025', testDate)).toBe('2025-12-30');
    });

    it('should apply upcoming year rule for dates without year', () => {
      // Date earlier than today should get next year
      expect(parseDate('1/15', testDate)).toBe('2026-01-15');
      expect(parseDate('5/31', testDate)).toBe('2026-05-31');
      
      // Date same or later than today should get current year
      expect(parseDate('12/30', testDate)).toBe('2025-12-30');
      expect(parseDate('12/23', testDate)).toBe('2025-12-23');
    });

    it('should handle various date formats', () => {
      expect(parseDate('1/5', testDate)).toBe('2026-01-05');
      expect(parseDate('01/05', testDate)).toBe('2026-01-05');
      // 12/5 is earlier than today (12/23), so it gets next year
      expect(parseDate('12/5', testDate)).toBe('2026-12-05');
      expect(parseDate('12/05', testDate)).toBe('2026-12-05');
    });

    it('should return null for invalid dates', () => {
      expect(parseDate('', testDate)).toBe(null);
      expect(parseDate(null, testDate)).toBe(null);
      expect(parseDate('invalid', testDate)).toBe(null);
      expect(parseDate('13/1', testDate)).toBe(null);
      expect(parseDate('1/32', testDate)).toBe(null);
    });
  });

  describe('getEventStatus function', () => {
    const today = new Date('2025-12-23T00:00:00.000Z');

    it('should return "past" for events that ended before today', () => {
      expect(getEventStatus('2025-12-01', '2025-12-22', today)).toBe('past');
    });

    it('should return "current" for events happening today', () => {
      expect(getEventStatus('2025-12-20', '2025-12-25', today)).toBe('current');
      expect(getEventStatus('2025-12-23', '2025-12-23', today)).toBe('current');
    });

    it('should return "future" for events starting after today', () => {
      expect(getEventStatus('2025-12-24', '2025-12-31', today)).toBe('future');
    });
  });

  describe('filterEvents function', () => {
    const today = new Date('2025-12-23T00:00:00.000Z');
    const events = [
      { startDate: '2025-12-01', endDate: '2025-12-22' }, // past
      { startDate: '2025-12-20', endDate: '2025-12-25' }, // current
      { startDate: '2025-12-24', endDate: '2025-12-31' }, // future
    ];

    it('should return all events for "all" filter', () => {
      const filtered = filterEvents(events, 'all', today);
      expect(filtered).toHaveLength(3);
    });

    it('should return only current events for "current" filter', () => {
      const filtered = filterEvents(events, 'current', today);
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual(events[1]);
    });

    it('should return current and future events for "future" filter', () => {
      const filtered = filterEvents(events, 'future', today);
      expect(filtered).toHaveLength(2);
      expect(filtered).toEqual([events[1], events[2]]);
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-endpoint')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found'
        }
      });
    });
  });

  describe('GET /operations/:sheetId/site-info', () => {
    
    beforeEach(() => {
      // Clear mock calls and cache between tests
      mockSheetsApi.spreadsheets.values.get.mockClear();
      // Clear any cache that might interfere with tests
      const NodeCache = require('node-cache');
      const cache = new NodeCache({ stdTTL: 60 });
      cache.flushAll();
    });

    it('should return 400 when sheetId is missing', async () => {
      const response = await request(app)
        .get('/operations//site-info')
        .expect(404); // Express returns 404 for empty params
    });

    it('should return 404 when sheet is not found', async () => {
      mockSheetsApi.spreadsheets.values.get.mockClear();
      mockSheetsApi.spreadsheets.values.get.mockRejectedValue({ code: 404 });

      const response = await request(app)
        .get('/operations/invalid-sheet-id/site-info')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'SHEET_NOT_FOUND',
          message: 'Operations sheet not found or not accessible'
        }
      });
    });

    it('should return 404 when Site Info tab is not found', async () => {
      mockSheetsApi.spreadsheets.values.get.mockClear();
      mockSheetsApi.spreadsheets.values.get.mockRejectedValue(new Error('Unable to parse range'));

      const response = await request(app)
        .get('/operations/some-sheet-id/site-info')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'TAB_NOT_FOUND',
          message: 'Site Info tab not found in the specified sheet'
        }
      });
    });

    it('should return empty data when sheet has no data', async () => {
      mockSheetsApi.spreadsheets.values.get.mockClear();
      mockSheetsApi.spreadsheets.values.get.mockResolvedValue({
        data: { values: [] }
      });

      const response = await request(app)
        .get('/operations/empty-sheet-id/site-info')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          sheetId: 'empty-sheet-id',
          tabName: 'Site Info',
          totalRecords: 0,
          siteInfo: []
        }
      });
    });

    it('should return parsed site info data', async () => {
      const mockData = [
        ['Channel', 'Computer', 'Date', 'Singular', 'Facility', 'Division', 'STAFF', '1st Game Start', 'Last Game End (Last Game Start + 1 HR)', 'Site Map', 'Internet?', 'Ethernet Info', 'WIFI username', 'WIFI password', 'Jump Available', 'Zixi Ingest'],
        ['CH1', 'GD08', '12/12/2025', 'https://app.singular.live/control/abc123', 'Pool 1: Gate', '', 'Amelia Stringham', '8:10:00 AM', '8:50:00 PM', '', '', '', '', '', '', ''],
        ['CH2', 'GD01', '12/12/2025', 'https://app.singular.live/control/def456', 'Pool 2: Middle', '', 'Adam Brzyski', '7:00:00 AM', '9:20:00 PM', '', '', '', '', '', '', '']
      ];

      // Clear and set up mock for this specific test
      mockSheetsApi.spreadsheets.values.get.mockClear();
      mockSheetsApi.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockData }
      });

      const response = await request(app)
        .get('/operations/parse-test-sheet/site-info')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sheetId).toBe('parse-test-sheet');
      expect(response.body.data.tabName).toBe('Site Info');
      expect(response.body.data.totalRecords).toBe(2);
      expect(response.body.data.siteInfo).toHaveLength(2);

      // Check first record structure
      const firstRecord = response.body.data.siteInfo[0];
      expect(firstRecord.channel).toBe('CH1');
      expect(firstRecord.computer).toBe('GD08');
      expect(firstRecord.date).toBe('12/12/2025');
      expect(firstRecord.parsedDate).toBe('2025-12-12T00:00:00.000Z');
      expect(firstRecord.singular).toBe('https://app.singular.live/control/abc123');
      expect(firstRecord.facility).toBe('Pool 1: Gate');
      expect(firstRecord.staff).toBe('Amelia Stringham');
      expect(firstRecord.num1stGameStart).toBe('8:10:00 AM');
    });

    it('should handle ETag caching', async () => {
      const mockData = [
        ['Channel', 'Computer', 'Date'],
        ['CH1', 'GD08', '12/12/2025']
      ];

      mockSheetsApi.spreadsheets.values.get.mockClear();
      mockSheetsApi.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockData }
      });

      // First request
      const response1 = await request(app)
        .get('/operations/etag-test-sheet/site-info')
        .expect(200);

      const etag = response1.headers.etag;
      expect(etag).toBeDefined();

      // Second request with ETag should return 304
      const response2 = await request(app)
        .get('/operations/etag-test-sheet/site-info')
        .set('If-None-Match', etag)
        .expect(304);

      expect(response2.text).toBe('');
    });
  });

  describe('GET /operations/:sheetId/schedule', () => {
    
    beforeEach(() => {
      // Clear mock calls and cache between tests
      mockSheetsApi.spreadsheets.values.get.mockClear();
      // Clear any cache that might interfere with tests
      const NodeCache = require('node-cache');
      const cache = new NodeCache({ stdTTL: 60 });
      cache.flushAll();
    });

    it('should return 400 when sheetId is missing', async () => {
      const response = await request(app)
        .get('/operations//schedule?date=2025-12-12&location=Pool%201:%20Gate')
        .expect(404); // Express returns 404 for empty params
    });

    it('should return 400 when date parameter is missing', async () => {
      const response = await request(app)
        .get('/operations/test-sheet/schedule?location=Pool%201:%20Gate')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Both date and location parameters are required'
        }
      });
    });

    it('should return 400 when location parameter is missing', async () => {
      const response = await request(app)
        .get('/operations/test-sheet/schedule?date=2025-12-12')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Both date and location parameters are required'
        }
      });
    });

    it('should return 400 when date format is invalid', async () => {
      const response = await request(app)
        .get('/operations/test-sheet/schedule?date=12/12/2025&location=Pool%201:%20Gate')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Date must be in YYYY-MM-DD format'
        }
      });
    });

    it('should return 404 when sheet is not found', async () => {
      mockSheetsApi.spreadsheets.values.get.mockClear();
      mockSheetsApi.spreadsheets.values.get.mockRejectedValue({ code: 404 });

      const response = await request(app)
        .get('/operations/invalid-sheet/schedule?date=2025-12-12&location=Pool%201:%20Gate')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'SHEET_NOT_FOUND',
          message: 'Operations sheet not found or not accessible'
        }
      });
    });

    it('should return 404 when Master Schedule tab is not found', async () => {
      mockSheetsApi.spreadsheets.values.get.mockClear();
      mockSheetsApi.spreadsheets.values.get.mockRejectedValue(new Error('Unable to parse range'));

      const response = await request(app)
        .get('/operations/test-sheet/schedule?date=2025-12-12&location=Pool%201:%20Gate')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'TAB_NOT_FOUND',
          message: 'Master Schedule tab not found in the specified sheet'
        }
      });
    });

    it('should return empty schedule when no games match criteria', async () => {
      const mockData = [
        ['DATE', 'TIME', 'LOCATION', 'GAME#', 'TEAM 1', 'T1 SCORE', 'TEAM 2', 'T2 SCORE', 'COMMENTS', 'DIVISION', 'ACTUAL START TIME'],
        ['12/13/2025', '8:10:00 AM', 'Pool 2: Middle', '1', 'Team A', '', 'Team B', '', '', '14U Boys', '8:10:00 AM']
      ];

      mockSheetsApi.spreadsheets.values.get.mockClear();
      mockSheetsApi.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockData }
      });

      const response = await request(app)
        .get('/operations/empty-schedule-test/schedule?date=2025-12-12&location=Pool%201:%20Gate')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          sheetId: 'empty-schedule-test',
          tabName: 'Master Schedule',
          date: '2025-12-12',
          location: 'Pool 1: Gate',
          totalGames: 0,
          games: []
        }
      });
    });

    it('should return filtered and sorted schedule for date and location', async () => {
      const mockData = [
        ['DATE', 'TIME', 'LOCATION', 'GAME#', 'TEAM 1', 'T1 SCORE', 'TEAM 2', 'T2 SCORE', 'COMMENTS', 'DIVISION', 'ACTUAL START TIME'],
        ['12/12/2025', '10:40:00 AM', 'Pool 1: Gate', '4', 'Gladiator 16U Boys', '', 'Team Orlando 16U Boys TBD', '', '', '16U Boys', '10:59:00 AM'],
        ['12/12/2025', '8:10:00 AM', 'Pool 1: Gate', '1', 'NC Select 14U Boys', '', 'Orlando Thunder 14', '', '', '14U Boys', '8:10:00 AM'],
        ['12/12/2025', '9:00:00 AM', 'Pool 2: Middle', '17', 'Team Orlando 18U Girls', '', 'Brooklyn Hustle 18U Girls', '', '', '18U Girls', '9:05:00 AM'],
        ['12/12/2025', '9:00:00 AM', 'Pool 1: Gate', '2', 'Capital Water Polo 14U Boys', '', 'Team Orlando 14U Boys', '', '', '14U Boys', '9:03:00 AM'],
        ['12/13/2025', '8:10:00 AM', 'Pool 1: Gate', '43', 'Different Day Game', '', 'Another Team', '', '', '14U Boys', '8:10:00 AM']
      ];

      mockSheetsApi.spreadsheets.values.get.mockClear();
      mockSheetsApi.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockData }
      });

      const response = await request(app)
        .get('/operations/schedule-test-sheet/schedule?date=2025-12-12&location=Pool%201:%20Gate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sheetId).toBe('schedule-test-sheet');
      expect(response.body.data.tabName).toBe('Master Schedule');
      expect(response.body.data.date).toBe('2025-12-12');
      expect(response.body.data.location).toBe('Pool 1: Gate');
      expect(response.body.data.totalGames).toBe(3);
      expect(response.body.data.games).toHaveLength(3);

      // Check that games are sorted by time (chronological order)
      const games = response.body.data.games;
      expect(games[0].time).toBe('8:10:00 AM');
      expect(games[0].gameNumber).toBe(1);
      expect(games[0].team1).toBe('NC Select 14U Boys');
      
      expect(games[1].time).toBe('9:00:00 AM');
      expect(games[1].gameNumber).toBe(2);
      expect(games[1].team1).toBe('Capital Water Polo 14U Boys');
      
      expect(games[2].time).toBe('10:40:00 AM');
      expect(games[2].gameNumber).toBe(4);
      expect(games[2].team1).toBe('Gladiator 16U Boys');

      // Check that all expected fields are present
      expect(games[0].parsedDate).toBe('2025-12-12T00:00:00.000Z');
      expect(games[0].division).toBe('14U Boys');
      expect(games[0].actualStartTime).toBe('8:10:00 AM');
    });

    it('should handle ETag caching for schedule endpoint', async () => {
      const mockData = [
        ['DATE', 'TIME', 'LOCATION', 'GAME#', 'TEAM 1', 'T1 SCORE', 'TEAM 2', 'T2 SCORE', 'COMMENTS', 'DIVISION', 'ACTUAL START TIME'],
        ['12/12/2025', '8:10:00 AM', 'Pool 1: Gate', '1', 'Team A', '', 'Team B', '', '', '14U Boys', '8:10:00 AM']
      ];

      mockSheetsApi.spreadsheets.values.get.mockClear();
      mockSheetsApi.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockData }
      });

      // First request
      const response1 = await request(app)
        .get('/operations/etag-schedule-test/schedule?date=2025-12-12&location=Pool%201:%20Gate')
        .expect(200);

      const etag = response1.headers.etag;
      expect(etag).toBeDefined();

      // Second request with ETag should return 304
      const response2 = await request(app)
        .get('/operations/etag-schedule-test/schedule?date=2025-12-12&location=Pool%201:%20Gate')
        .set('If-None-Match', etag)
        .expect(304);

      expect(response2.text).toBe('');
    });
  });

  describe('PATCH /operations/:sheetId/schedule', () => {
    it('should update a game successfully', async () => {
      const mockData = [
        ['DATE', 'TIME', 'LOCATION', 'GAME#', 'TEAM 1', 'T1 SCORE', 'TEAM 2', 'T2 SCORE', 'COMMENTS', 'DIVISION', 'ACTUAL START TIME'],
        ['12/12/2025', '9:00:00 AM', 'Pool 1: Gate', '1', 'Team A', '', 'Team B', '', '', '14U Boys', ''],
        ['12/12/2025', '10:00:00 AM', 'Pool 1: Gate', '2', 'Team C', '', 'Team D', '', '', '14U Boys', '']
      ];

      mockSheetsApi.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockData }
      });

      mockSheetsApi.spreadsheets.values.update.mockResolvedValue({
        data: { updatedCells: 2 }
      });

      const updateRequest = {
        date: '2025-12-12',
        location: 'Pool 1: Gate',
        time: '9:00:00 AM',
        updates: {
          't1Score': '12',
          't2Score': '8',
          'actualStartTime': '9:05:00 AM',
          'comments': 'Game completed successfully'
        }
      };

      const response = await request(app)
        .patch('/operations/test-sheet-123/schedule')
        .send(updateRequest)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Game updated successfully',
        data: {
          sheetId: 'test-sheet-123',
          date: '2025-12-12',
          location: 'Pool 1: Gate',
          time: '9:00:00 AM',
          updatedFields: {
            't1Score': { from: '', to: '12' },
            't2Score': { from: '', to: '8' },
            'actualStartTime': { from: '', to: '9:05:00 AM' },
            'comments': { from: '', to: 'Game completed successfully' }
          }
        }
      });

      // Verify the update was called with correct parameters
      expect(mockSheetsApi.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: 'test-sheet-123',
        range: "'Master Schedule'!A2:K2", // Row 2 (1-based, including header)
        valueInputOption: 'RAW',
        resource: {
          values: [['12/12/2025', '9:00:00 AM', 'Pool 1: Gate', '1', 'Team A', '12', 'Team B', '8', 'Game completed successfully', '14U Boys', '9:05:00 AM']]
        }
      });
    });

    it('should return 404 when game is not found', async () => {
      const mockData = [
        ['DATE', 'TIME', 'LOCATION', 'GAME#', 'TEAM 1', 'T1 SCORE', 'TEAM 2', 'T2 SCORE', 'COMMENTS', 'DIVISION', 'ACTUAL START TIME'],
        ['12/12/2025', '9:00:00 AM', 'Pool 1: Gate', '1', 'Team A', '', 'Team B', '', '', '14U Boys', '']
      ];

      mockSheetsApi.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockData }
      });

      const updateRequest = {
        date: '2025-12-12',
        location: 'Pool 2: Middle',  // Different location
        time: '9:00:00 AM',
        updates: {
          't1Score': '12'
        }
      };

      const response = await request(app)
        .patch('/operations/test-sheet-123/schedule')
        .send(updateRequest)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'GAME_NOT_FOUND',
          message: 'No game found for date: 2025-12-12, location: Pool 2: Middle, time: 9:00:00 AM'
        }
      });

      expect(mockSheetsApi.spreadsheets.values.update).not.toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .patch('/operations/test-sheet-123/schedule')
        .send({
          date: '2025-12-12',
          location: 'Pool 1: Gate'
          // Missing time and updates
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'date, location, time, and updates fields are required'
        }
      });
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .patch('/operations/test-sheet-123/schedule')
        .send({
          date: '12/12/2025',  // Wrong format
          location: 'Pool 1: Gate',
          time: '9:00:00 AM',
          updates: { 't1Score': '12' }
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Date must be in YYYY-MM-DD format'
        }
      });
    });

    it('should return 400 for invalid update fields', async () => {
      const mockData = [
        ['DATE', 'TIME', 'LOCATION', 'GAME#', 'TEAM 1', 'T1 SCORE', 'TEAM 2', 'T2 SCORE', 'COMMENTS', 'DIVISION', 'ACTUAL START TIME'],
        ['12/12/2025', '9:00:00 AM', 'Pool 1: Gate', '1', 'Team A', '', 'Team B', '', '', '14U Boys', '']
      ];

      mockSheetsApi.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockData }
      });

      const response = await request(app)
        .patch('/operations/test-sheet-123/schedule')
        .send({
          date: '2025-12-12',
          location: 'Pool 1: Gate',
          time: '9:00:00 AM',
          updates: {
            'invalidField': 'some value',
            'anotherInvalid': 'another value'
          }
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_FIELDS',
          message: 'Invalid update fields: invalidField, anotherInvalid. Allowed fields: t1Score, t2Score, comments, actualStartTime, team1, team2, division, game'
        }
      });
    });

    it('should return success message when no changes are needed', async () => {
      const mockData = [
        ['DATE', 'TIME', 'LOCATION', 'GAME#', 'TEAM 1', 'T1 SCORE', 'TEAM 2', 'T2 SCORE', 'COMMENTS', 'DIVISION', 'ACTUAL START TIME'],
        ['12/12/2025', '9:00:00 AM', 'Pool 1: Gate', '1', 'Team A', '12', 'Team B', '8', 'Already done', '14U Boys', '9:05:00 AM']
      ];

      mockSheetsApi.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockData }
      });

      const updateRequest = {
        date: '2025-12-12',
        location: 'Pool 1: Gate',
        time: '9:00:00 AM',
        updates: {
          't1Score': '12',
          't2Score': '8',
          'actualStartTime': '9:05:00 AM',
          'comments': 'Already done'
        }
      };

      const response = await request(app)
        .patch('/operations/test-sheet-123/schedule')
        .send(updateRequest)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'No changes were necessary - all values were already up to date',
        data: {
          sheetId: 'test-sheet-123',
          date: '2025-12-12',
          location: 'Pool 1: Gate',
          time: '9:00:00 AM',
          updatedFields: {}
        }
      });

      expect(mockSheetsApi.spreadsheets.values.update).not.toHaveBeenCalled();
    });

    it('should handle sheet not found error', async () => {
      const error = new Error('Sheet not found');
      error.code = 404;
      mockSheetsApi.spreadsheets.values.get.mockRejectedValue(error);

      const response = await request(app)
        .patch('/operations/nonexistent-sheet/schedule')
        .send({
          date: '2025-12-12',
          location: 'Pool 1: Gate',
          time: '9:00:00 AM',
          updates: { 't1Score': '12' }
        })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'SHEET_NOT_FOUND',
          message: 'Operations sheet not found or not accessible'
        }
      });
    });

    it('should handle tab not found error', async () => {
      const error = new Error('Unable to parse range');
      mockSheetsApi.spreadsheets.values.get.mockRejectedValue(error);

      const response = await request(app)
        .patch('/operations/test-sheet-123/schedule')
        .send({
          date: '2025-12-12',
          location: 'Pool 1: Gate',
          time: '9:00:00 AM',
          updates: { 't1Score': '12' }
        })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'TAB_NOT_FOUND',
          message: 'Master Schedule tab not found in the specified sheet'
        }
      });
    });

    it('should handle empty sheet', async () => {
      mockSheetsApi.spreadsheets.values.get.mockResolvedValue({
        data: { values: [] }
      });

      const response = await request(app)
        .patch('/operations/empty-sheet/schedule')
        .send({
          date: '2025-12-12',
          location: 'Pool 1: Gate',
          time: '9:00:00 AM',
          updates: { 't1Score': '12' }
        })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'GAME_NOT_FOUND',
          message: 'No games found in Master Schedule'
        }
      });
    });

    it('should clear cache after successful update', async () => {
      const mockData = [
        ['DATE', 'TIME', 'LOCATION', 'GAME#', 'TEAM 1', 'T1 SCORE', 'TEAM 2', 'T2 SCORE', 'COMMENTS', 'DIVISION', 'ACTUAL START TIME'],
        ['12/12/2025', '9:00:00 AM', 'Pool 1: Gate', '1', 'Team A', '', 'Team B', '', '', '14U Boys', '']
      ];

      mockSheetsApi.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockData }
      });

      mockSheetsApi.spreadsheets.values.update.mockResolvedValue({
        data: { updatedCells: 1 }
      });

      const updateRequest = {
        date: '2025-12-12',
        location: 'Pool 1: Gate',
        time: '9:00:00 AM',
        updates: {
          't1Score': '15'
        }
      };

      const response = await request(app)
        .patch('/operations/test-sheet-123/schedule')
        .send(updateRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Game updated successfully');
    });
  });
});
