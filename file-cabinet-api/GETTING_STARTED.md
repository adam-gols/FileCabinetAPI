# 🎯 Getting Started

New to the File Cabinet API? Start here for a quick overview.

## What is this API?

A REST API that makes Google Sheets tournament data accessible for web applications, especially OBS Studio widgets for live streaming.

**Live API**: https://file-cabinet-api-822514983888.us-central1.run.app  
**Interactive Docs**: https://file-cabinet-api-822514983888.us-central1.run.app/api-docs/

## 🚀 Try it Right Now

No setup needed! Test the live API:

```bash
# Get API health status
curl https://file-cabinet-api-822514983888.us-central1.run.app/health

# Get sample tournament data (replace with actual tab name)
curl "https://file-cabinet-api-822514983888.us-central1.run.app/file-cabinet?tab=Leagues&dateFilter=future"
```

## 🎯 Common Use Cases

### 1. **OBS Studio Widgets** 
Display live tournament information on streams
→ See the `../gols-obs-widget/` folder

### 2. **Tournament Websites**
Show upcoming events and schedules
→ Use `/file-cabinet` endpoints

### 3. **Live Score Updates**
Update game scores in real-time during tournaments
→ Use `/operations/{sheetId}/schedule` PATCH endpoint

## 📚 Documentation Guide

**Just want to use the API?**
- Start with the [Interactive Swagger Docs](https://file-cabinet-api-822514983888.us-central1.run.app/api-docs/)

**Need detailed technical info?**
- Read [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) - Complete technical reference

**Want to deploy your own instance?**
- Follow [`QUICK_SETUP.md`](./QUICK_SETUP.md) - Step-by-step deployment guide
- Or [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Detailed deployment documentation

**Building an AI integration?**
- Check [`AI_INTEGRATION_GUIDE.md`](./AI_INTEGRATION_GUIDE.md) - Comprehensive AI system guide

**Working with Operations Sheets?**
- See [`OPS_SHEETS_SPEC.md`](./OPS_SHEETS_SPEC.md) - Sheet format specifications

## ⚡ Quick Examples

### Get Tournament Events
```javascript
// Get all upcoming tournaments
fetch('https://file-cabinet-api-822514983888.us-central1.run.app/file-cabinet?tab=Leagues&dateFilter=future')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Get Game Schedule
```javascript
// Get today's games at a specific venue
const sheetId = 'your-operations-sheet-id';
const today = '2025-12-24';
const venue = 'Pool 1: Gate';

fetch(`https://file-cabinet-api-822514983888.us-central1.run.app/operations/${sheetId}/schedule?date=${today}&location=${venue}`)
  .then(response => response.json())
  .then(games => console.log(games));
```

### Update Game Score
```javascript
// Update a game's score in real-time
const updateData = {
  date: "2025-12-24",
  location: "Pool 1: Gate", 
  time: "9:00:00 AM",
  updates: {
    t1Score: "15",
    t2Score: "12",
    actualStartTime: "9:05:00 AM"
  }
};

fetch(`https://file-cabinet-api-822514983888.us-central1.run.app/operations/${sheetId}/schedule`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updateData)
})
.then(response => response.json())
.then(result => console.log(result));
```

## 🤔 Need Help?

- **Interactive Documentation**: Try the [Swagger UI](https://file-cabinet-api-822514983888.us-central1.run.app/api-docs/) to test endpoints
- **Examples**: All documentation files include working examples
- **Schemas**: Check the OpenAPI specification in `openapi.yaml`

---

*Ready to dive deeper? Choose the appropriate documentation file from the list above!*
