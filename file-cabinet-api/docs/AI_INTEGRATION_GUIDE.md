# File Cabinet API - AI Integration Guide

## Overview for AI Systems

This guide provides comprehensive instructions for AI systems to understand and effectively use the File Cabinet REST API. The API is a production-ready backend that serves the Game On Live Studio OBS widget by providing access to sports tournament data stored in Google Sheets.

## Understanding the System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   OBS Widget    │◄──►│ File Cabinet API │◄──►│   Google Sheets     │
│  (Frontend)     │    │   (Backend)      │    │ (Data Storage)      │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

### Key Concepts for AI Understanding:

1. **File Cabinet Sheet**: Main spreadsheet containing event listings (tournaments, scrimmages, etc.)
2. **Operations Sheets**: Individual spreadsheets per event containing detailed game schedules and site information
3. **Sheet ID**: Each Google Sheet has a unique identifier used in API calls
4. **Real-time Updates**: The API supports both reading and writing data for live tournament management

## Complete API Reference for AI Systems

### Production API Base URL
```
https://file-cabinet-api-822514983888.us-central1.run.app
```

### Authentication Model
- **No client credentials required**
- **Server handles all Google Sheets authentication**
- **CORS enabled for browser-based applications**
- **No API keys or tokens needed**

## Endpoint Catalog

### 1. Health Check
```http
GET /health
```
**Purpose**: Verify API availability
**Response**: Service status and version information
**Use Case**: System monitoring and connectivity testing

### 2. File Cabinet Events
```http
GET /file-cabinet
```
**Purpose**: Get list of all available tournaments/events
**Parameters**:
- `tab` (required): Specific sheet tab name
- `sheetId` (optional): Custom Google Sheets ID for alternative File Cabinet spreadsheets
- `dateFilter` (optional): `"all"`, `"current"`, or `"future"`

**Spreadsheet Selection**:
- If `sheetId` is provided: Uses the specified custom spreadsheet
- If `sheetId` is omitted: Uses the default File Cabinet spreadsheet
- Useful for accessing different tournament organizations or backup spreadsheets

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "totalEvents": 15,
    "events": [
      {
        "event": "Tournament Name",
        "date": "2024-01-15",
        "time": "7:00 PM",
        "type": "Tournament",
        "league": "League Name",
        "sheetId": "1ABC123...",
        "url": "https://docs.google.com/spreadsheets/d/1ABC123..."
      }
    ]
  }
}
```

**Example Usage**:
```bash
# Use default File Cabinet
curl "https://file-cabinet-api-822514983888.us-central1.run.app/file-cabinet?tab=Leagues"

# Use custom File Cabinet spreadsheet
curl "https://file-cabinet-api-822514983888.us-central1.run.app/file-cabinet?tab=Leagues&sheetId=1CustomSheet123456789"
```

### 3. Site Information
```http
GET /operations/{sheetId}/site-info
```
**Purpose**: Get tournament venue and broadcast details
**Parameters**: 
- `sheetId`: Google Sheet ID for specific event (from File Cabinet response)

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "tournament": "Tournament Name",
    "venue": "Venue Name",
    "address": "123 Main St, City, State 12345",
    "broadcastDetails": {
      "platform": "Twitch",
      "channel": "channelname",
      "startTime": "7:00 PM EST"
    },
    "contactInfo": {
      "coordinator": "John Doe",
      "email": "coordinator@example.com"
    }
  }
}
```

### 4. Game Schedule
```http
GET /operations/{sheetId}/schedule
```
**Purpose**: Get complete game schedule for an event
**Parameters**: 
- `sheetId`: Google Sheet ID for specific event
- `gameFilter` (optional): `"all"`, `"current"`, `"next"`, `"completed"`

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "totalGames": 8,
    "lastUpdated": "2024-01-15T19:30:00.000Z",
    "games": [
      {
        "game": "Game 1",
        "time": "7:00 PM",
        "team1": "Team Alpha",
        "team2": "Team Beta",
        "score1": 2,
        "score2": 1,
        "status": "completed",
        "comments": "Great match!",
        "startedAt": "2024-01-15T19:00:00.000Z"
      }
    ]
  }
}
```

### 5. Update Game (Real-time Updates)
```http
PATCH /operations/{sheetId}/schedule
```
**Purpose**: Update game scores, status, and details in real-time
**Content-Type**: `application/json`

**Request Body Structure**:
```json
{
  "game": "Game 1",
  "updates": {
    "score1": 3,
    "score2": 2,
    "status": "in-progress",
    "comments": "Overtime match!",
    "startedAt": "2024-01-15T19:05:00.000Z"
  }
}
```

**Response Structure**:
```json
{
  "success": true,
  "message": "Game updated successfully",
  "data": {
    "game": "Game 1",
    "updatedFields": ["score1", "score2", "status", "comments", "startedAt"],
    "timestamp": "2024-01-15T20:15:30.000Z"
  }
}
```

## Data Types and Field Specifications

### Event Object Fields
- `event`: Tournament/event name (string)
- `date`: Event date in YYYY-MM-DD format (string)
- `time`: Start time (string, various formats)
- `type`: Event type - "Tournament", "Scrimmage", etc. (string)
- `league`: Associated league/organization (string)
- `sheetId`: Google Sheet ID for operations data (string)
- `url`: Direct link to Google Sheet (string)

### Game Object Fields
- `game`: Game identifier/name (string)
- `time`: Scheduled start time (string)
- `team1`, `team2`: Team names (string)
- `score1`, `score2`: Team scores (number, can be null)
- `status`: Game status - "scheduled", "in-progress", "completed", "postponed" (string)
- `comments`: Additional notes (string, can be null)
- `startedAt`: Actual start timestamp (ISO 8601 string, can be null)

### Site Info Object Fields
- `tournament`: Tournament name (string)
- `venue`: Venue name (string)
- `address`: Full venue address (string)
- `broadcastDetails`: Object containing platform, channel, startTime
- `contactInfo`: Object containing coordinator name and email

## Error Handling for AI Systems

### HTTP Status Code Meanings
- `200`: Successful request
- `400`: Bad request (invalid parameters)
- `404`: Resource not found (invalid sheet ID)
- `500`: Server error (Google Sheets API issues)

### Error Response Structure
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description",
    "code": "ERROR_CODE",
    "details": "Additional technical details"
  }
}
```

### Common Error Scenarios for AI to Handle
1. **Invalid Sheet ID**: When sheetId doesn't exist or is inaccessible
2. **Sheet Permission Issues**: When API lacks proper Google Sheets access
3. **Network Timeouts**: When Google Sheets API is slow
4. **Invalid Update Data**: When PATCH request contains invalid field values

## Caching Behavior for AI Systems

### Cache Duration
- **File Cabinet data**: 60 seconds
- **Site Info**: 60 seconds  
- **Schedule data**: 60 seconds (invalidated on PATCH updates)

### Cache Headers
The API returns standard HTTP cache headers:
- `Cache-Control: public, max-age=60`
- `ETag`: Unique identifier for data version
- `Last-Modified`: Timestamp of last data change

### AI Cache Strategy Recommendations
1. **Respect cache headers** to minimize API calls
2. **Use conditional requests** with If-None-Match header
3. **Implement local caching** with 60-second TTL
4. **Cache invalidation**: Refresh after successful PATCH operations

## Integration Patterns for AI Systems

### 1. Tournament Discovery Flow
```javascript
// Step 1: Get available events (using default File Cabinet)
const events = await fetch(`${BASE_URL}/file-cabinet?tab=Leagues`)
  .then(r => r.json());

// OR: Get events from custom File Cabinet spreadsheet
const customEvents = await fetch(`${BASE_URL}/file-cabinet?tab=Leagues&sheetId=1CustomSheet123456789`)
  .then(r => r.json());

// Step 2: Filter events by criteria
const currentEvents = events.data.events.filter(
  event => event.date === today && event.type === 'Tournament'
);

// Step 3: Get detailed info for selected event
const siteInfo = await fetch(`${BASE_URL}/operations/${sheetId}/site-info`)
  .then(r => r.json());

const schedule = await fetch(`${BASE_URL}/operations/${sheetId}/schedule`)
  .then(r => r.json());
```

### 1a. Multi-Organization Tournament Discovery
```javascript
// Handle multiple tournament organizations with different File Cabinet sheets
const organizations = [
  { name: 'League A', sheetId: '1LeagueASheet123456789' },
  { name: 'League B', sheetId: '1LeagueBSheet987654321' },
  { name: 'Default', sheetId: null } // Uses default FILE_CABINET_SHEET_ID
];

const getAllTournaments = async () => {
  const allTournaments = [];
  
  for (const org of organizations) {
    try {
      const url = org.sheetId 
        ? `${BASE_URL}/file-cabinet?tab=Leagues&sheetId=${org.sheetId}`
        : `${BASE_URL}/file-cabinet?tab=Leagues`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        // Add organization info to each event
        const eventsWithOrg = data.data.events.map(event => ({
          ...event,
          organization: org.name
        }));
        allTournaments.push(...eventsWithOrg);
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${org.name}:`, error);
    }
  }
  
  return allTournaments;
};
```

### 2. Real-time Game Updates
```javascript
// Monitor for game updates needed
const updateGame = async (sheetId, gameId, newScore1, newScore2) => {
  const response = await fetch(`${BASE_URL}/operations/${sheetId}/schedule`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      game: gameId,
      updates: {
        score1: newScore1,
        score2: newScore2,
        status: 'in-progress'
      }
    })
  });
  
  return response.json();
};
```

### 3. OBS Widget Data Pipeline
```javascript
// Complete data flow for OBS widget
class FileCabinetWidget {
  constructor() {
    this.baseUrl = 'https://file-cabinet-api-822514983888.us-central1.run.app';
    this.cache = new Map();
  }
  
  async getCurrentTournament(customSheetId = null) {
    // Get today's tournaments from specified or default File Cabinet
    const url = customSheetId 
      ? `/file-cabinet?tab=Leagues&dateFilter=current&sheetId=${customSheetId}`
      : `/file-cabinet?tab=Leagues&dateFilter=current`;
    
    const events = await this.fetchWithCache(url);
    return events.data.events[0]; // Assume first current event
  }
  
  async getTournamentDetails(sheetId) {
    const [siteInfo, schedule] = await Promise.all([
      this.fetchWithCache(`/operations/${sheetId}/site-info`),
      this.fetchWithCache(`/operations/${sheetId}/schedule?gameFilter=current`)
    ]);
    
    return {
      tournament: siteInfo.data,
      currentGame: schedule.data.games[0]
    };
  }
  
  async updateGameScore(sheetId, game, score1, score2) {
    const response = await fetch(`${this.baseUrl}/operations/${sheetId}/schedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game: game,
        updates: { score1, score2, status: 'in-progress' }
      })
    });
    
    // Invalidate cache after update
    this.cache.delete(`/operations/${sheetId}/schedule`);
    return response.json();
  }
}
```

## Data Validation Rules

### For PATCH Operations
1. **Game Identification**: `game` field must exactly match existing game name
2. **Score Validation**: Scores must be non-negative numbers
3. **Status Values**: Only "scheduled", "in-progress", "completed", "postponed"
4. **Timestamp Format**: ISO 8601 format required for startedAt
5. **Field Requirements**: At least one field must be provided in updates object

### For Query Parameters
1. **Sheet ID Format**: Must be valid Google Sheets ID (long alphanumeric string)
2. **Custom Sheet Access**: API must have read permissions to any custom sheetId provided
3. **Date Filters**: Only "all", "current", "future" accepted
4. **Game Filters**: Only "all", "current", "next", "completed" accepted

### For File Cabinet Access
1. **Tab Parameter**: Required when calling /file-cabinet endpoint
2. **Sheet ID Fallback**: Uses FILE_CABINET_SHEET_ID environment variable when sheetId not provided
3. **Permission Requirements**: Custom sheets must be readable by the API service account
4. **Cache Isolation**: Different sheetId values maintain separate cache entries
3. **Game Filters**: Only "all", "current", "next", "completed" accepted

## Performance Considerations for AI Systems

### Request Timing
- **Average Response Time**: 200-500ms for cached data
- **Cold Start**: First request may take 2-3 seconds
- **Google Sheets Latency**: 1-2 seconds for fresh data

### Rate Limiting Guidelines
- **No hard rate limits** currently implemented
- **Recommended**: Max 10 requests per second per client
- **Batch operations**: Use parallel requests for multiple sheet IDs

### Optimal Usage Patterns
1. **Cache aggressively**: Respect 60-second cache duration
2. **Batch requests**: Get site-info and schedule simultaneously
3. **Use filters**: Specify gameFilter/dateFilter to reduce payload size
4. **Conditional requests**: Use ETag headers to avoid unnecessary data transfer

## Troubleshooting Guide for AI Systems

### Common Issues and Solutions

#### 1. "Sheet not found" or permission errors
- **Cause**: Invalid sheetId, insufficient permissions, or private sheet
- **Solution**: Verify sheetId parameter and ensure sheet is accessible to API service account
- **Debug**: Test with default File Cabinet first, then try custom sheetId
- **Custom Sheet Requirements**: Sheet must be shared with API service account or made publicly readable

#### 2. PATCH operations failing
- **Cause**: Invalid game name or field values
- **Solution**: Use exact game name from GET /schedule response
- **Debug**: Validate all update fields before sending

#### 3. Slow response times
- **Cause**: Google Sheets API latency, cold starts, or permission checks on custom sheets
- **Solution**: Implement client-side caching and retries
- **Debug**: Check response headers for cache status

#### 4. Custom sheetId not working
- **Cause**: Sheet ID format incorrect or sheet not accessible
- **Solution**: Verify sheet ID format and permissions
- **Debug Steps**:
  1. Try the same request without sheetId (using default)
  2. Verify sheet ID is correct (from Google Sheets URL)
  3. Check that custom sheet has same column structure as default File Cabinet

#### 4. CORS issues in browser
- **Cause**: Incorrect request headers or methods
- **Solution**: API supports all standard CORS headers
- **Debug**: Check browser developer tools for preflight requests

### Error Recovery Strategies
1. **Retry with exponential backoff** for 5xx errors
2. **Validate data locally** before PATCH requests
3. **Fallback to cached data** when API is unavailable
4. **Graceful degradation** when specific sheets are inaccessible

## Testing and Development

### API Testing Commands
```bash
# Health check
curl https://file-cabinet-api-822514983888.us-central1.run.app/health

# Get events from default File Cabinet
curl "https://file-cabinet-api-822514983888.us-central1.run.app/file-cabinet?tab=Leagues&dateFilter=current"

# Get events from custom File Cabinet spreadsheet
curl "https://file-cabinet-api-822514983888.us-central1.run.app/file-cabinet?tab=Leagues&sheetId=1YourCustomSheet123456789"

# Get schedule from operations sheet (replace SHEET_ID)
curl "https://file-cabinet-api-822514983888.us-central1.run.app/operations/SHEET_ID/schedule"

# Update game in operations sheet (replace SHEET_ID)
curl -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"game":"Game 1","updates":{"score1":2,"score2":1}}' \
  "https://file-cabinet-api-822514983888.us-central1.run.app/operations/SHEET_ID/schedule"

# Test custom sheet permissions
curl -v "https://file-cabinet-api-822514983888.us-central1.run.app/file-cabinet?tab=Leagues&sheetId=1TestSheet123" \
  | jq '.error.message'  # Check for permission errors
```

### OpenAPI Documentation
Interactive API documentation available at:
- **Swagger UI**: https://file-cabinet-api-822514983888.us-central1.run.app/api-docs
- **Raw OpenAPI spec**: Available in repository as `config/openapi.yaml`

## Best Practices Summary for AI Systems

1. **Always check success field** in API responses
2. **Handle errors gracefully** with appropriate fallbacks
3. **Use appropriate HTTP methods** (GET for reading, PATCH for updates)
4. **Respect caching headers** to optimize performance
5. **Validate input data** before sending PATCH requests
6. **Implement retry logic** for transient failures
7. **Use specific filters** to reduce payload size
8. **Monitor API health** with regular /health checks
9. **Cache responses locally** with 60-second TTL
10. **Test error scenarios** during development

This guide provides comprehensive information for AI systems to effectively integrate with and utilize the File Cabinet API in production environments.
