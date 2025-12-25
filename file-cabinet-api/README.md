# File Cabinet Public API

A production-ready REST API built for Google Cloud Run that exposes event data from Google Sheets spreadsheets. Features intelligent date parsing, efficient caching, and ETag support for optimal performance.

**🎯 New here? Start with [`GETTING_STARTED.md`](./GETTING_STARTED.md) for a quick overview and examples!**

**Live API**: https://file-cabinet-api-822514983888.us-central1.run.app  
**Interactive Docs**: https://file-cabinet-api-822514983888.us-central1.run.app/api-docs/

## 🚀 Features

- **Public REST API** - No authentication required
- **Google Sheets Integration** - Direct integration with Google Sheets API v4
- **Smart Date Parsing** - Intelligent "upcoming year" logic for dates without years
- **Flexible Filtering** - Filter events by `all`, `current`, or `future`
- **Efficient Caching** - In-memory caching with 60-second TTL
- **ETag Support** - HTTP caching with conditional requests
- **Cloud Run Ready** - Containerized and optimized for Google Cloud Run
- **Comprehensive Testing** - Full test suite with Jest and Supertest

## 📋 API Endpoints

### Health Check
```
GET /health
```

### Get Events
```
GET /file-cabinet?tab=TabName&dateFilter=future
```

**Parameters:**
- `tab` (required) - Spreadsheet tab name
- `dateFilter` (optional) - `all`, `current`, `future` (default: `all`)
- `today` (optional) - Date override in `YYYY-MM-DD` format for testing

### Operations Endpoints
```
GET /operations/{sheetId}/site-info
GET /operations/{sheetId}/schedule?date=YYYY-MM-DD&location=Pool
PATCH /operations/{sheetId}/schedule
```

**Live API**: https://file-cabinet-api-822514983888.us-central1.run.app  
**Documentation**: https://file-cabinet-api-822514983888.us-central1.run.app/api-docs/

## 📊 Spreadsheet Format

Your Google Sheets must have these exact column headers:

| Event Name | Event Link | Start Date | End Date |
|------------|------------|------------|----------|
| 2026 League | https://... | 1/15 | 5/31 |

**Supported Date Formats:**
- `M/D` → `1/15`
- `12/30` → `2025-12-30` (current year)

## 🏗️ Quick Start

### Local Development

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   # Create .env file
   FILE_CABINET_SHEET_ID=your_spreadsheet_id
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

### Google Cloud Run Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

## 📚 API Documentation

Interactive API documentation is available in the [OpenAPI specification](./config/openapi.yaml).

### Endpoints

#### File Cabinet Events
- **GET** `/file-cabinet?tab={tabName}&dateFilter={filter}&today={date}`
  - Returns event data from the File Cabinet spreadsheet
  - Supports filtering by date (all, current, future)

#### Operations Sheets
- **GET** `/operations/{sheetId}/site-info`
  - Returns all data from the "Site Info" tab of an Operations Sheet
  - Includes channel assignments, staff, schedules, and equipment details

- **GET** `/operations/{sheetId}/schedule`
  - Returns game schedule data from the "Master Schedule" tab
  - Supports filtering by date and location

- **PATCH** `/operations/{sheetId}/schedule`
  - Updates game information in the "Master Schedule" tab
  - Allows real-time score updates and game modifications

### Example Response

```json
{
  "success": true,
  "data": [
    {
      "eventName": "2026 SoCal Futures League",
      "eventLink": "https://docs.google.com/spreadsheets/d/...",
      "startDate": "2026-01-15",
      "endDate": "2026-05-31",
      "status": "future"
    }
  ],
  "meta": {
    "tab": "Leagues",
    "dateFilter": "future",
    "count": 1
  }
}
```

## 🏷️ Event Status

Each event includes a calculated `status` field:
- `past` - Event ended before today
- `current` - Event is happening now (today falls between start and end dates)
- `future` - Event hasn't started yet

## 🔄 Caching Strategy

- **Server-side**: In-memory cache with 60-second TTL
- **HTTP Caching**: `Cache-Control: public, max-age=60` (disabled when `today` param is used)
- **ETags**: Conditional requests supported with `If-None-Match` header

## 🛠️ Built With

- **Node.js** - Runtime environment
- **Express** - Web framework
- **Google APIs** - Sheets integration
- **NodeCache** - In-memory caching
- **Jest** - Testing framework
- **Docker** - Containerization

## 🔧 Configuration

| Environment Variable | Required | Description |
|---------------------|----------|-------------|
| `FILE_CABINET_SHEET_ID` | ✅ | Google Sheets spreadsheet ID |
| `PORT` | ❌ | Server port (default: 8080) |
| `GOOGLE_APPLICATION_CREDENTIALS` | ✅ | Path to service account JSON file |

## 📦 Project Structure

```
├── src/                  # Source code
│   └── index.js         # Main application
├── test/                 # Test files
│   └── index.test.js    # Test suite  
├── docs/                 # Documentation
│   ├── GETTING_STARTED.md
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT.md
│   └── ...
├── config/               # Configuration files
│   ├── openapi.yaml     # API specification
│   └── .env.example     # Environment template
├── scripts/              # Build and deployment scripts
│   └── deploy.sh        # Deployment script
├── package.json          # Dependencies and scripts
├── Dockerfile            # Container definition
└── README.md            # This file
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch
```

Tests cover:
- API endpoint responses
- Date parsing logic
- Event filtering
- Error handling
- Utility functions

## 🚨 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required query parameter: tab"
  }
}
```

**Error Codes:**
- `INVALID_REQUEST` - Bad request parameters
- `NOT_FOUND` - Tab or resource not found
- `SERVICE_ERROR` - Internal server error

## 🔒 Security

- **No authentication** - Public endpoint by design
- **Read-only access** - Service account has Sheets viewer permissions only
- **Minimal permissions** - Principle of least privilege
- **Input validation** - All parameters validated and sanitized

## 📈 Monitoring

The API is designed for easy monitoring:
- Health check endpoint for liveness probes
- Structured error responses
- Cloud Run compatible logging
- Performance metrics via Google Cloud Monitoring

## 🔄 Updates and Maintenance

1. **Update dependencies:** `npm update`
2. **Run tests:** `npm test`
3. **Rebuild container:** `docker build -t file-cabinet-api .`
4. **Redeploy:** Follow deployment guide

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

---

**Built for Google Cloud Run** | **Production Ready** | **Fully Tested**
