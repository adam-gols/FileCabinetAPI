const express = require('express');
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const NodeCache = require('node-cache');
const crypto = require('crypto');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Load OpenAPI specification
const swaggerDocument = YAML.load(path.join(__dirname, '../config/openapi.yaml'));

// Middleware for parsing JSON request bodies
app.use(express.json({ limit: '1mb' }));

// CORS middleware to allow browser requests from any origin
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, If-None-Match');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'File Cabinet API Documentation',
  customfavIcon: '/favicon.ico',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    docExpansion: 'list',
    operationsSorter: 'alpha'
  }
}));

// Serve OpenAPI spec as JSON
app.get('/openapi.json', (req, res) => {
  res.json(swaggerDocument);
});

// Initialize cache with 60-second TTL
const cache = new NodeCache({ stdTTL: 60 });

// Initialize Google Sheets API
let sheetsApi = null;
let auth = null;

async function initializeGoogleSheets() {
  // Skip initialization in test environment with mocked modules
  if (process.env.NODE_ENV === 'test') {
    const { google } = require('googleapis');
    sheetsApi = google.sheets({ version: 'v4' });
    console.log('Google Sheets API initialized for testing');
    return;
  }
  
  try {
    auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const authClient = await auth.getClient();
    sheetsApi = google.sheets({ version: 'v4', auth: authClient });
    
    console.log('Google Sheets API initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Google Sheets API:', error);
    throw error;
  }
}

// Utility function to parse dates with "upcoming year" logic
function parseDate(dateStr, today = new Date()) {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }

  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Handle various date formats
  const patterns = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // M/D/YYYY or MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})$/ // M/D or MM/DD
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const month = parseInt(match[1], 10);
      const day = parseInt(match[2], 10);
      let year = match[3] ? parseInt(match[3], 10) : null;

      // Validate month and day
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        continue;
      }

      // Apply "upcoming year" rule if no year provided
      if (!year) {
        const currentYear = today.getFullYear();
        const todayMonth = today.getMonth() + 1;
        const todayDay = today.getDate();

        // Compare MM/DD to today's MM/DD
        if (month < todayMonth || (month === todayMonth && day < todayDay)) {
          year = currentYear + 1; // Next year
        } else {
          year = currentYear; // Current year
        }
      }

      // Create date object and validate it's a real date
      const parsedDate = new Date(year, month - 1, day);
      if (parsedDate.getFullYear() === year &&
          parsedDate.getMonth() === month - 1 &&
          parsedDate.getDate() === day) {
        return parsedDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
      }
    }
  }

  return null;
}

// Determine event status relative to today
function getEventStatus(startDate, endDate, today) {
  const todayStr = today.toISOString().split('T')[0];
  
  if (endDate < todayStr) {
    return 'past';
  } else if (startDate <= todayStr && endDate >= todayStr) {
    return 'current';
  } else {
    return 'future';
  }
}

// Filter events based on dateFilter parameter
function filterEvents(events, dateFilter, today) {
  const todayStr = today.toISOString().split('T')[0];
  
  switch (dateFilter) {
    case 'current':
      return events.filter(event => 
        event.startDate <= todayStr && event.endDate >= todayStr
      );
    case 'future':
      return events.filter(event => event.endDate >= todayStr);
    case 'all':
    default:
      return events;
  }
}

// Generate ETag from data
function generateETag(data) {
  const hash = crypto.createHash('md5');
  hash.update(JSON.stringify(data));
  return `"${hash.digest('hex')}"`;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'file-cabinet-api',
    version: '1.0.0'
  });
});

// Main file cabinet endpoint
app.get('/file-cabinet', async (req, res) => {
  try {
    const { tab, dateFilter = 'all', today: todayOverride, sheetId } = req.query;

    // Validate required tab parameter
    if (!tab) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required query parameter: tab'
        }
      });
    }

    // Validate dateFilter parameter
    const validFilters = ['all', 'current', 'future'];
    if (!validFilters.includes(dateFilter)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid dateFilter. Must be one of: all, current, future'
        }
      });
    }

    // Parse today override if provided
    let today = new Date();
    if (todayOverride) {
      const overrideDate = new Date(todayOverride + 'T00:00:00.000Z');
      if (isNaN(overrideDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid today parameter. Must be in YYYY-MM-DD format'
          }
        });
      }
      today = overrideDate;
    }

    // Determine which spreadsheet ID to use
    const spreadsheetId = sheetId || process.env.FILE_CABINET_SHEET_ID;
    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'No spreadsheet ID available. Either provide sheetId parameter or set FILE_CABINET_SHEET_ID environment variable'
        }
      });
    }

    // Generate cache key including spreadsheet ID
    const cacheKey = `${spreadsheetId}:${tab}:${dateFilter}:${todayOverride || 'default'}`;
    
    // Check cache first
    let responseData = cache.get(cacheKey);
    
    if (!responseData) {
      // Fetch data from Google Sheets
      if (!sheetsApi) {
        throw new Error('Google Sheets API not initialized');
      }

      let sheetData;
      try {
        const response = await sheetsApi.spreadsheets.values.get({
          spreadsheetId,
          range: `'${tab}'!A:D`,
        });
        sheetData = response.data;
      } catch (error) {
        if (error.code === 400 && error.message.includes('Unable to parse range')) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `Tab '${tab}' not found in spreadsheet`
            }
          });
        }
        if (error.code === 403) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'PERMISSION_DENIED',
              message: 'Access denied to the specified spreadsheet. Check sharing permissions.'
            }
          });
        }
        if (error.code === 404) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Spreadsheet not found. Verify the sheet ID is correct.'
            }
          });
        }
        throw error;
      }

      const rows = sheetData.values || [];
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Tab '${tab}' not found in File Cabinet`
          }
        });
      }

      // Validate headers
      const headers = rows[0];
      const expectedHeaders = ['Event Name', 'Event Link', 'Start Date', 'End Date'];
      
      if (!expectedHeaders.every(header => headers.includes(header))) {
        throw new Error('Invalid spreadsheet format. Expected headers: Event Name, Event Link, Start Date, End Date');
      }

      // Process data rows
      const events = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 4) continue; // Skip incomplete rows

        const eventName = row[0]?.trim();
        const eventLink = row[1]?.trim();
        const startDateStr = row[2]?.trim();
        const endDateStr = row[3]?.trim();

        // Skip rows with missing essential data
        if (!eventName || !startDateStr || !endDateStr) continue;

        const startDate = parseDate(startDateStr, today);
        const endDate = parseDate(endDateStr, today);

        // Skip rows with invalid dates
        if (!startDate || !endDate) continue;

        events.push({
          eventName,
          eventLink: eventLink || '',
          startDate,
          endDate,
          status: getEventStatus(startDate, endDate, today)
        });
      }

      // Filter events based on dateFilter
      const filteredEvents = filterEvents(events, dateFilter, today);

      // Sort by start date ascending
      filteredEvents.sort((a, b) => a.startDate.localeCompare(b.startDate));

      responseData = {
        success: true,
        data: filteredEvents,
        meta: {
          tab,
          dateFilter,
          count: filteredEvents.length
        }
      };

      // Cache the response
      cache.set(cacheKey, responseData);
    }

    // Generate ETag
    const etag = generateETag(responseData);

    // Check If-None-Match header
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag === etag) {
      return res.status(304).end();
    }

    // Set cache headers
    if (!todayOverride) {
      res.set('Cache-Control', 'public, max-age=60');
    } else {
      res.set('Cache-Control', 'no-store');
    }

    res.set('ETag', etag);
    res.json(responseData);

  } catch (error) {
    console.error('Error in /file-cabinet endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVICE_ERROR',
        message: 'Internal server error occurred while processing request'
      }
    });
  }
});

// Operations Sheets: Get all Site Info data
app.get('/operations/:sheetId/site-info', async (req, res) => {
  try {
    const { sheetId } = req.params;
    
    if (!sheetId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Sheet ID is required'
        }
      });
    }

    // Generate cache key
    const cacheKey = `ops:${sheetId}:site-info`;
    
    // Check cache first
    let responseData = cache.get(cacheKey);
    
    if (!responseData) {
      // Fetch data from Google Sheets
      if (!sheetsApi) {
        throw new Error('Google Sheets API not initialized');
      }

      let sheetData;
      try {
        const response = await sheetsApi.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: "'Site Info'!A:P", // Columns A through P as per spec
        });
        sheetData = response.data;
      } catch (error) {
        if (error.code === 404) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'SHEET_NOT_FOUND',
              message: 'Operations sheet not found or not accessible'
            }
          });
        }
        if (error.message && error.message.includes('Unable to parse range')) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'TAB_NOT_FOUND',
              message: 'Site Info tab not found in the specified sheet'
            }
          });
        }
        throw error;
      }

      const values = sheetData.values || [];
      
      if (values.length === 0) {
        responseData = {
          success: true,
          data: {
            sheetId,
            tabName: 'Site Info',
            totalRecords: 0,
            siteInfo: []
          }
        };
      } else {
        // Expected headers based on OPS_SHEETS_SPEC.md
        const expectedHeaders = [
          'Channel', 'Computer', 'Date', 'Singular', 'Facility', 'Division',
          'STAFF', '1st Game Start', 'Last Game End (Last Game Start + 1 HR)',
          'Site Map', 'Internet?', 'Ethernet Info', 'WIFI username', 
          'WIFI password', 'Jump Available', 'Zixi Ingest'
        ];

        const headers = values[0] || [];
        const dataRows = values.slice(1);

        // Parse each row into structured data
        const siteInfo = dataRows
          .filter(row => {
            // Keep rows that have at least the first 3 columns (Channel, Computer, Date) with non-empty values
            const hasRequiredFields = row && row.length >= 3 && 
                   row[0] && row[0].toString().trim() !== '' && // Channel
                   row[1] && row[1].toString().trim() !== '' && // Computer
                   row[2] && row[2].toString().trim() !== '';   // Date
            
            return hasRequiredFields;
          })
          .map(row => {
            const record = {};
            
            // Map each column to its expected field
            expectedHeaders.forEach((header, index) => {
              const value = row[index] || '';
              const trimmedValue = typeof value === 'string' ? value.trim() : value;
              
              // Use camelCase field names for consistent API responses
              const fieldName = header
                .replace(/[^\w\s]/g, '') // Remove special characters
                .replace(/\s+/g, ' ')    // Normalize spaces
                .split(' ')
                .map((word, idx) => {
                  if (idx === 0) {
                    // First word: handle numbers at start
                    if (/^\d/.test(word)) {
                      return 'num' + word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                    }
                    return word.toLowerCase();
                  }
                  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                })
                .join('');
              
              record[fieldName] = trimmedValue;
            });

            // Parse date if present
            if (record.date) {
              const parsedDateStr = parseDate(record.date);
              record.parsedDate = parsedDateStr ? new Date(parsedDateStr + 'T00:00:00.000Z').toISOString() : null;
            }

            return record;
          });

        responseData = {
          success: true,
          data: {
            sheetId,
            tabName: 'Site Info',
            totalRecords: siteInfo.length,
            headers: expectedHeaders,
            siteInfo
          }
        };
      }

      // Cache the response
      cache.set(cacheKey, responseData);
    }

    // Generate ETag for response
    const etag = crypto.createHash('md5')
      .update(JSON.stringify(responseData))
      .digest('hex');

    // Check if client has current version
    const clientETag = req.headers['if-none-match'];
    if (clientETag === etag) {
      return res.status(304).send();
    }

    // Set cache headers
    res.set({
      'ETag': etag,
      'Cache-Control': 'public, max-age=60'
    });

    res.json(responseData);

  } catch (error) {
    console.error('Error in /operations/:sheetId/site-info endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVICE_ERROR',
        message: 'Internal server error occurred while processing request'
      }
    });
  }
});

// Operations Sheets: Get daily schedule for a specific date and location
app.get('/operations/:sheetId/schedule', async (req, res) => {
  try {
    const { sheetId } = req.params;
    const { date, location } = req.query;
    
    if (!sheetId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Sheet ID is required'
        }
      });
    }

    if (!date || !location) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Both date and location parameters are required'
        }
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Date must be in YYYY-MM-DD format'
        }
      });
    }

    // Convert date to MM/DD/YYYY format for matching spreadsheet data
    const [year, month, day] = date.split('-');
    const sheetDateFormat = `${parseInt(month)}/${parseInt(day)}/${year}`;

    // Generate cache key
    const cacheKey = `ops:${sheetId}:schedule:${date}:${location}`;
    
    // Check cache first
    let responseData = cache.get(cacheKey);
    
    if (!responseData) {
      // Fetch data from Google Sheets
      if (!sheetsApi) {
        throw new Error('Google Sheets API not initialized');
      }

      let sheetData;
      try {
        const response = await sheetsApi.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: "'Master Schedule'!A:K", // Columns A through K as per spec
        });
        sheetData = response.data;
      } catch (error) {
        if (error.code === 404) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'SHEET_NOT_FOUND',
              message: 'Operations sheet not found or not accessible'
            }
          });
        }
        if (error.message && error.message.includes('Unable to parse range')) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'TAB_NOT_FOUND',
              message: 'Master Schedule tab not found in the specified sheet'
            }
          });
        }
        throw error;
      }

      const values = sheetData.values || [];
      
      if (values.length === 0) {
        responseData = {
          success: true,
          data: {
            sheetId,
            tabName: 'Master Schedule',
            date,
            location,
            totalGames: 0,
            games: []
          }
        };
      } else {
        // Expected headers based on OPS_SHEETS_SPEC.md
        const expectedHeaders = [
          'DATE', 'TIME', 'LOCATION', 'GAME#', 'TEAM 1', 'T1 SCORE',
          'TEAM 2', 'T2 SCORE', 'COMMENTS', 'DIVISION', 'ACTUAL START TIME'
        ];

        const headers = values[0] || [];
        const dataRows = values.slice(1);

        // Filter and parse games for the specified date and location
        const games = dataRows
          .filter(row => {
            // Keep rows that have required fields and match our date/location criteria
            return row && row.length >= 4 && 
                   row[0] && row[0].toString().trim() === sheetDateFormat && // DATE matches
                   row[2] && row[2].toString().trim() === location;         // LOCATION matches
          })
          .map(row => {
            const record = {};
            
            // Map each column to its expected field
            expectedHeaders.forEach((header, index) => {
              const value = row[index] || '';
              const trimmedValue = typeof value === 'string' ? value.trim() : value;
              
              // Use camelCase field names for consistent API responses
              const fieldName = header
                .replace(/[^\w\s]/g, '') // Remove special characters
                .replace(/\s+/g, ' ')    // Normalize spaces
                .split(' ')
                .map((word, idx) => {
                  if (idx === 0) {
                    // First word: handle numbers at start
                    if (/^\d/.test(word)) {
                      return 'num' + word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                    }
                    return word.toLowerCase();
                  }
                  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                })
                .join('');
              
              record[fieldName] = trimmedValue;
            });

            // Parse game date if present
            if (record.date) {
              const parsedDateStr = parseDate(record.date);
              record.parsedDate = parsedDateStr ? new Date(parsedDateStr + 'T00:00:00.000Z').toISOString() : null;
            }

            // Parse game number as integer
            if (record.game) {
              const gameNum = parseInt(record.game, 10);
              record.gameNumber = !isNaN(gameNum) ? gameNum : null;
            }

            return record;
          })
          .sort((a, b) => {
            // Sort by time - parse time strings for proper chronological ordering
            const timeA = a.time || '';
            const timeB = b.time || '';
            
            if (!timeA || !timeB) {
              return timeA.localeCompare(timeB);
            }
            
            // Convert time strings to comparable format (24-hour)
            const parseTime = (timeStr) => {
              const match = timeStr.match(/^(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i);
              if (!match) return timeStr; // fallback to string comparison
              
              let [, hours, minutes, seconds, period] = match;
              hours = parseInt(hours, 10);
              
              if (period.toUpperCase() === 'PM' && hours !== 12) {
                hours += 12;
              } else if (period.toUpperCase() === 'AM' && hours === 12) {
                hours = 0;
              }
              
              return hours * 10000 + parseInt(minutes, 10) * 100 + parseInt(seconds, 10);
            };
            
            const numericTimeA = parseTime(timeA);
            const numericTimeB = parseTime(timeB);
            
            if (typeof numericTimeA === 'number' && typeof numericTimeB === 'number') {
              return numericTimeA - numericTimeB;
            }
            
            return timeA.localeCompare(timeB);
          });

        responseData = {
          success: true,
          data: {
            sheetId,
            tabName: 'Master Schedule',
            date,
            location,
            totalGames: games.length,
            games
          }
        };
      }

      // Cache the response
      cache.set(cacheKey, responseData);
    }

    // Generate ETag for response
    const etag = crypto.createHash('md5')
      .update(JSON.stringify(responseData))
      .digest('hex');

    // Check if client has current version
    const clientETag = req.headers['if-none-match'];
    if (clientETag === etag) {
      return res.status(304).send();
    }

    // Set cache headers
    res.set({
      'ETag': etag,
      'Cache-Control': 'public, max-age=60'
    });

    res.json(responseData);

  } catch (error) {
    console.error('Error in /operations/:sheetId/schedule endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVICE_ERROR',
        message: 'Internal server error occurred while processing request'
      }
    });
  }
});

// PATCH endpoint for updating games in the Master Schedule
app.patch('/operations/:sheetId/schedule', async (req, res) => {
  try {
    const { sheetId } = req.params;
    const { date, location, time, updates } = req.body;
    
    // Validate required parameters
    if (!sheetId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Sheet ID is required'
        }
      });
    }

    if (!date || !location || !time || !updates) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'date, location, time, and updates fields are required'
        }
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Date must be in YYYY-MM-DD format'
        }
      });
    }

    // Validate updates is an object
    if (typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'updates must be an object'
        }
      });
    }

    // Convert date to MM/DD/YYYY format for matching spreadsheet data
    const [year, month, day] = date.split('-');
    const sheetDateFormat = `${parseInt(month)}/${parseInt(day)}/${year}`;

    if (!sheetsApi) {
      throw new Error('Google Sheets API not initialized');
    }

    // First, get the current data to find the row to update
    let sheetData;
    try {
      const response = await sheetsApi.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "'Master Schedule'!A:K", // Columns A through K as per spec
      });
      sheetData = response.data;
    } catch (error) {
      if (error.code === 404) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SHEET_NOT_FOUND',
            message: 'Operations sheet not found or not accessible'
          }
        });
      }
      if (error.message && error.message.includes('Unable to parse range')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TAB_NOT_FOUND',
            message: 'Master Schedule tab not found in the specified sheet'
          }
        });
      }
      throw error;
    }

    const values = sheetData.values || [];
    
    if (values.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'GAME_NOT_FOUND',
          message: 'No games found in Master Schedule'
        }
      });
    }

    // Expected headers and their column mappings
    const expectedHeaders = [
      'DATE', 'TIME', 'LOCATION', 'GAME#', 'TEAM 1', 'T1 SCORE',
      'TEAM 2', 'T2 SCORE', 'COMMENTS', 'DIVISION', 'ACTUAL START TIME'
    ];

    const headers = values[0] || [];
    const dataRows = values.slice(1);

    // Find the row that matches date, location, and time
    let targetRowIndex = -1;
    let targetRow = null;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (row && row.length >= 3) {
        const rowDate = row[0] ? row[0].toString().trim() : '';
        const rowTime = row[1] ? row[1].toString().trim() : '';
        const rowLocation = row[2] ? row[2].toString().trim() : '';

        if (rowDate === sheetDateFormat && 
            rowTime === time && 
            rowLocation === location) {
          targetRowIndex = i + 2; // +1 for header row, +1 for 1-based indexing
          targetRow = [...row]; // Make a copy
          break;
        }
      }
    }

    if (targetRowIndex === -1) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'GAME_NOT_FOUND',
          message: `No game found for date: ${date}, location: ${location}, time: ${time}`
        }
      });
    }

    // Map update fields to column indices
    const fieldToColumnMap = {
      't1Score': 5,      // T1 SCORE
      't2Score': 7,      // T2 SCORE
      'comments': 8,     // COMMENTS
      'actualStartTime': 10, // ACTUAL START TIME
      'team1': 4,        // TEAM 1
      'team2': 6,        // TEAM 2
      'division': 9,     // DIVISION
      'game': 3          // GAME#
    };

    // Validate that all update fields are allowed
    const allowedFields = Object.keys(fieldToColumnMap);
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FIELDS',
          message: `Invalid update fields: ${invalidFields.join(', ')}. Allowed fields: ${allowedFields.join(', ')}`
        }
      });
    }

    // Apply updates to the target row
    let hasChanges = false;
    const updatedFields = {};

    for (const [field, value] of Object.entries(updates)) {
      const columnIndex = fieldToColumnMap[field];
      const currentValue = targetRow[columnIndex] || '';
      const newValue = value ? value.toString() : '';
      
      if (currentValue !== newValue) {
        // Ensure the row is long enough
        while (targetRow.length <= columnIndex) {
          targetRow.push('');
        }
        
        targetRow[columnIndex] = newValue;
        updatedFields[field] = {
          from: currentValue,
          to: newValue
        };
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      return res.status(200).json({
        success: true,
        message: 'No changes were necessary - all values were already up to date',
        data: {
          sheetId,
          date,
          location,
          time,
          updatedFields: {}
        }
      });
    }

    // Update the row in Google Sheets
    try {
      await sheetsApi.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `'Master Schedule'!A${targetRowIndex}:K${targetRowIndex}`,
        valueInputOption: 'RAW',
        resource: {
          values: [targetRow]
        }
      });

      // Clear related cache entries
      const baseCacheKey = `ops:${sheetId}:schedule:${date}:${location}`;
      cache.del(baseCacheKey);
      
      // Also clear any cached entries that might include this game
      const cacheKeys = cache.keys();
      cacheKeys.forEach(key => {
        if (key.includes(`ops:${sheetId}:schedule`) || key.includes(`ops:${sheetId}:site-info`)) {
          cache.del(key);
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Game updated successfully',
        data: {
          sheetId,
          date,
          location,
          time,
          updatedFields
        }
      });

    } catch (error) {
      console.error('Error updating Google Sheet:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error in PATCH /operations/:sheetId/schedule endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVICE_ERROR',
        message: 'Internal server error occurred while updating game'
      }
    });
  }
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVICE_ERROR',
      message: 'Internal server error'
    }
  });
});

// Initialize and start server
async function startServer() {
  try {
    await initializeGoogleSheets();
    app.listen(port, () => {
      console.log(`File Cabinet API listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Initialize for tests if in test environment
async function initializeForTests() {
  if (process.env.NODE_ENV === 'test') {
    await initializeGoogleSheets();
  }
}

if (require.main === module) {
  startServer();
} else if (process.env.NODE_ENV === 'test') {
  // Initialize immediately for tests
  initializeForTests();
}

module.exports = { app, parseDate, getEventStatus, filterEvents, initializeForTests };
