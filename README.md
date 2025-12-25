# FileCabinetAPI Project

This project contains multiple related components for sports tournament management:

## 📂 Project Structure

### `/file-cabinet-api/`
The main REST API for accessing Google Sheets "File Cabinet" data. This API provides:
- Read-only access to event/game data from spreadsheets
- Operations sheet endpoints for tournament management
- Real-time game score updates via PATCH endpoints
- Swagger/OpenAPI documentation

**Live API**: https://file-cabinet-api-822514983888.us-central1.run.app  
**Documentation**: https://file-cabinet-api-822514983888.us-central1.run.app/api-docs/

### `/gols-obs-widget/`
GOLS (Game Operations Live Scoreboard) OBS Widget for live streaming overlays. This widget provides:
- Real-time game information display
- Live score updates from the File Cabinet API
- Tournament bracket progression
- Stream-ready overlays for OBS Studio

## 🚀 Getting Started

Each folder contains its own README with specific setup instructions:
- See `file-cabinet-api/README.md` for API setup and deployment
- See `gols-obs-widget/README.md` for widget setup and usage

## 📋 Related Documentation

- **API Deployment Guide**: `file-cabinet-api/DEPLOYMENT.md`
- **Operations Sheets Specification**: `file-cabinet-api/OPS_SHEETS_SPEC.md`
- **Project Scope**: `file-cabinet-api/PROJECT_SCOPE_V2.md`

## 🔗 Integration

The GOLS OBS Widget consumes data from the File Cabinet API, creating a complete tournament management and broadcasting solution.

## 📄 License

MIT License - see individual project folders for specific details.
