# Original Project Specification

> **Note**: This file contains the original project requirements and specifications used during development. For current documentation and usage, see:
> - [`GETTING_STARTED.md`](./GETTING_STARTED.md) - Quick start guide
> - [`README.md`](./README.md) - Current project overview
> - [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) - Complete API reference

---

# `instructions.md`

## Project Name

**File Cabinet Public API (Google Cloud Run)**

---

## Objective

Build and deploy a **public, read-only REST API** on **Google Cloud Run** that exposes event data from a **Google Sheets “File Cabinet” spreadsheet**.

The API must:

* Read data from a specified **sheet tab**
* Normalize and infer dates intelligently
* Filter events by time window
* Sort results consistently
* Cache responses efficiently
* Be safe for public access

---

## High-Level Architecture

```
Client (Browser / App)
        ↓
Cloud Run (Node.js + Express)
        ↓
Google Sheets API (read-only)
```

* No authentication required (public endpoint)
* Stateless service with per-instance in-memory caching
* Google service account used to read the spreadsheet

---

## Runtime & Platform

* **Platform:** Google Cloud Run
* **Language:** Node.js (v20+)
* **Framework:** Express
* **Data Source:** Google Sheets API v4
* **Deployment:** Containerized (Docker)

---

## Environment Variables

| Name                    | Required | Description                     |
| ----------------------- | -------- | ------------------------------- |
| `FILE_CABINET_SHEET_ID` | ✅ Yes    | Google Sheets ID (not full URL) |

---

## Spreadsheet Contract (Strict)

Each tab in the spreadsheet uses the following header row **exactly**:

| Column Name  | Description                    |
| ------------ | ------------------------------ |
| `Event Name` | Display name of the event      |
| `Event Link` | URL to the event’s spreadsheet |
| `Start Date` | Event start date               |
| `End Date`   | Event end date                 |

### Date Format Rules

* Dates may appear as:

  * `M/D`
  * `MM/DD`
  * `M/D/YYYY`
  * `MM/DD/YYYY`
* The API must tolerate Google Sheets date formatting quirks.

---

## API Endpoints

### Health Check

**GET** `/health`

**Response**

```json
{
  "status": "ok",
  "service": "file-cabinet-api",
  "version": "1.0.0"
}
```

---

### File Cabinet Endpoint

**GET** `/file-cabinet`

Returns events from a specified spreadsheet tab.

---

## Query Parameters

| Parameter    | Required | Values                                     |
| ------------ | -------- | ------------------------------------------ |
| `tab`        | ✅ Yes    | Name of the spreadsheet tab                |
| `dateFilter` | ❌ No     | `all` (default), `current`, `future`       |
| `today`      | ❌ No     | ISO date (`YYYY-MM-DD`) – testing override |

---

## Date Interpretation Logic (CRITICAL)

### “Upcoming Year” Rule (Required)

When a date **does not include a year**:

1. Compare `MM/DD` to today’s `MM/DD`
2. If the date is **earlier than today**, assume **next year**
3. Otherwise, assume **current year**

**Example (today = Dec 22, 2025)**

| Sheet Value | Interpreted As |
| ----------- | -------------- |
| `1/15`      | `2026-01-15`   |
| `5/31`      | `2026-05-31`   |
| `12/30`     | `2025-12-30`   |

If a year **is provided**, use it exactly.

---

## Date Filtering Behavior

### `dateFilter=all`

* Return all events

### `dateFilter=current`

Return events where:

```
startDate ≤ today ≤ endDate
```

### `dateFilter=future`

Return events where:

```
endDate ≥ today
```

---

## Sorting Rules

* Sort by **Start Date ascending**
* Earliest event first
* Stable sort (preserve original order for ties)

---

## Response Format

### Success Response

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

---

## Derived Fields

### `status`

Calculated per event:

* `past`
* `current`
* `future`

---

## Caching Requirements (MANDATORY)

### Server-Side Cache

* In-memory per Cloud Run instance
* Cache key includes:

  ```
  tab + dateFilter + todayOverride
  ```
* TTL: **60 seconds**

### HTTP Caching

* If `today` param is **not present**:

  ```
  Cache-Control: public, max-age=60
  ```
* If `today` **is present**:

  ```
  Cache-Control: no-store
  ```

---

## ETag Support (MANDATORY)

* Generate `ETag` as a hash of the response payload
* If request includes `If-None-Match` matching current ETag:

  * Respond with **HTTP 304**
  * No response body

---

## Error Handling

### Missing Tab Parameter

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required query parameter: tab"
  }
}
```

### Tab Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Tab '<name>' not found in File Cabinet"
  }
}
```

---

## Security Model

* Public endpoint
* No authentication
* Google Sheets accessed via **service account**
* Service account has **Viewer** permission on the spreadsheet only

---

## Non-Goals (Explicitly Out of Scope)

* No write operations
* No authentication or user accounts
* No database
* No pagination (dataset expected to be small)
* No UI

---

## Deployment Expectations

* Containerized via Docker
* Deployable with:

  ```
  gcloud run deploy
  ```
* Scales to zero when idle
* Region-agnostic

---

## Deliverables

The AI should produce:

1. `index.js` (Express app)
2. `package.json`
3. `Dockerfile`
4. Deployment instructions
5. Optional OpenAPI (Swagger) spec

---

## Quality Bar

This API must be:

* Deterministic
* Cache-safe
* Human-date-friendly
* Production-ready
* Easy to extend later (e.g., new tabs, filters)

---

## Documentation

### API Documentation
- **`API_DOCUMENTATION.md`**: Complete technical documentation for developers
- **`AI_INTEGRATION_GUIDE.md`**: Comprehensive guide for AI systems and automated integrations
- **`PROJECT_SCOPE_V2.md`**: Overall project architecture and OBS widget requirements
- **`openapi.yaml`**: OpenAPI 3.0 specification for interactive documentation

### Interactive API Testing
- **Swagger UI**: https://file-cabinet-api-822514983888.us-central1.run.app/api-docs
- **Health Check**: https://file-cabinet-api-822514983888.us-central1.run.app/health

### Key Features for AI Systems
The AI Integration Guide (`AI_INTEGRATION_GUIDE.md`) includes:
- Complete endpoint reference with detailed examples
- Data validation rules and field specifications
- Error handling patterns and recovery strategies
- Caching behavior and optimization guidelines
- Integration patterns for OBS widgets and real-time applications
- Troubleshooting guide for common scenarios

---

**END OF INSTRUCTIONS**