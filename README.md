# File Cabinet API & GOLS Widget

Complete production-ready File Cabinet API with GOLS UI Widget integration.

## 🚀 Features

### File Cabinet API
- ✅ **CORS Enabled** - Works from any browser context (including OBS Studio)
- ✅ **Google Cloud Run Deployment** - Production-ready scalable deployment
- ✅ **Google Sheets Integration** - Direct API access to event and schedule data
- ✅ **IndexedDB Storage** - Offline resilience for crash recovery
- ✅ **RESTful Endpoints** - Complete CRUD operations with OpenAPI documentation

### GOLS UI Widget
- ✅ **Live Data Integration** - Fetches real-time data from Google Sheets
- ✅ **Dynamic Stream Loading** - Populates streams based on selected events
- ✅ **Schedule Management** - Load and navigate through game schedules
- ✅ **Automatic Time Tracking** - First game -5min, subsequent games use current time
- ✅ **Auto-Save Functionality** - Changes automatically saved to API on navigation
- ✅ **Cross-Platform Compatible** - Works in browsers, OBS Studio, file:// protocol

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GOLS Widget   │◄──►│  File Cabinet    │◄──►│  Google Sheets  │
│   (Browser)     │    │     API          │    │   (Data Store)  │
│                 │    │ (Cloud Run)      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│   IndexedDB     │    │   API Cache      │
│ (Offline Store) │    │  (Memory/TTL)    │
└─────────────────┘    └──────────────────┘
```

## 🎯 Workflow

1. **Event Selection** → Loads available events from Google Sheets
2. **Stream Selection** → Fetches site info from ops sheets  
3. **Schedule Loading** → Gets game schedule for selected date/facility
4. **Game Navigation** → Browse games with auto-save on changes
5. **Time Tracking** → Automatic actual start time recording

## 📁 Project Structure

```
FileCabinetAPI/
├── file-cabinet-api/          # Backend API
│   ├── src/index.js          # Main API server with CORS
│   ├── scripts/deploy.sh     # Google Cloud Run deployment
│   └── docs/                 # API documentation
├── gols-obs-widget_UI/       # Frontend Widget
│   ├── src/js/              # JavaScript modules
│   ├── src/styles/          # CSS styling
│   └── index.html           # Main widget interface
└── README.md
```

## 🚀 Quick Start

### API Deployment
```bash
cd file-cabinet-api
./scripts/deploy.sh
```

### Widget Usage
```bash
cd gols-obs-widget_UI
open index.html
```

## 🛠️ Key Technologies

- **Backend**: Node.js, Express, Google Sheets API, Google Cloud Run
- **Frontend**: Vanilla JavaScript, IndexedDB, Fetch API
- **Storage**: Google Sheets, IndexedDB (offline)
- **Deployment**: Docker, Google Cloud Run, CORS-enabled

## 💾 Data Flow

1. **Events**: File Cabinet API → Google Sheets (2026 OPS SHEET LINKS)
2. **Streams**: Site Info from individual ops sheets  
3. **Schedule**: Master Schedule tab with game details
4. **Updates**: PATCH API saves changes back to Google Sheets

Production API: `https://file-cabinet-api-s3afg2f2mq-uc.a.run.app`
