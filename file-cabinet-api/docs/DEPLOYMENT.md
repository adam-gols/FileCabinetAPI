# File Cabinet Public API - Deployment Guide

This guide covers the complete setup and deployment process for the File Cabinet Public API on Google Cloud Run.

## Prerequisites

- Google Cloud Platform account with billing enabled
- Google Cloud SDK (`gcloud`) installed and configured
- Docker installed locally
- A Google Sheets spreadsheet with the required format

## 1. Google Service Account Setup

### Create a Service Account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **IAM & Admin > Service Accounts**
4. Click **Create Service Account**
5. Fill in the details:
   - **Name**: `file-cabinet-api`
   - **Description**: `Service account for File Cabinet API to read Google Sheets`
6. Click **Create and Continue**
7. Skip role assignment for now (we'll handle this at the spreadsheet level)
8. Click **Done**

### Generate Service Account Key

1. Find your new service account in the list
2. Click the **Actions** menu (three dots) and select **Manage Keys**
3. Click **Add Key > Create New Key**
4. Select **JSON** format and click **Create**
5. Save the downloaded JSON file securely - you'll need it for deployment

### Grant Spreadsheet Access

1. Open your File Cabinet Google Sheets spreadsheet
2. Click **Share** in the top-right corner
3. Add the service account email (found in the JSON file as `client_email`)
4. Set permission to **Viewer**
5. Click **Send**

## 2. Spreadsheet Format Validation

Ensure your spreadsheet tabs have exactly these column headers in row 1:

| Column A    | Column B    | Column C     | Column D   |
|-------------|-------------|--------------|------------|
| Event Name  | Event Link  | Start Date   | End Date   |

### Supported Date Formats

- `M/D` (e.g., `1/15`, `12/5`)
- `MM/DD` (e.g., `01/15`, `12/05`)
- `M/D/YYYY` (e.g., `1/15/2026`)
- `MM/DD/YYYY` (e.g., `01/15/2026`)

## 3. Local Development Setup

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file (not included in version control):

```bash
FILE_CABINET_SHEET_ID=your_spreadsheet_id_here
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
```

> **Note**: The spreadsheet ID is the long string in the Google Sheets URL:  
> `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

### Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:8080`

### Run Tests

```bash
npm test
```

For watch mode during development:

```bash
npm run test:watch
```

## 4. Docker Build and Test

### Build Docker Image

```bash
docker build -t file-cabinet-api .
```

### Test Docker Container Locally

```bash
docker run -p 8080:8080 \
  -e FILE_CABINET_SHEET_ID=your_spreadsheet_id \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json \
  -v /path/to/your/service-account-key.json:/app/service-account-key.json:ro \
  file-cabinet-api
```

## 5. Google Cloud Run Deployment

### Enable Required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Configure Docker for Google Cloud

```bash
gcloud auth configure-docker
```

### Build and Push Container

```bash
# Tag image for Google Container Registry
docker tag file-cabinet-api gcr.io/YOUR_PROJECT_ID/file-cabinet-api

# Push to registry
docker push gcr.io/YOUR_PROJECT_ID/file-cabinet-api
```

### Deploy to Cloud Run

```bash
gcloud run deploy file-cabinet-api \
  --image gcr.io/YOUR_PROJECT_ID/file-cabinet-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FILE_CABINET_SHEET_ID=your_spreadsheet_id \
  --service-account file-cabinet-api@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --memory 512Mi \
  --concurrency 100 \
  --max-instances 10
```

### Alternative: Deploy with Service Account Key

If you prefer to use the JSON key file instead of IAM roles:

```bash
gcloud run deploy file-cabinet-api \
  --image gcr.io/YOUR_PROJECT_ID/file-cabinet-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FILE_CABINET_SHEET_ID=your_spreadsheet_id \
  --set-env-vars GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json \
  --memory 512Mi \
  --concurrency 100 \
  --max-instances 10
```

> **Note**: You'll need to include the service account key in your Docker image for this approach.

## 6. Verification

### Test Health Endpoint

```bash
curl https://your-cloud-run-url/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "file-cabinet-api",
  "version": "1.0.0"
}
```

### Test File Cabinet Endpoint

```bash
curl "https://your-cloud-run-url/file-cabinet?tab=YourTabName&dateFilter=all"
```

## 7. Verify Deployment

### Test API Endpoints

```bash
# Test health check
curl https://YOUR_SERVICE_URL/health

# Test file cabinet endpoint with required parameters
curl "https://YOUR_SERVICE_URL/file-cabinet?tab=YourTabName"

# Test with custom sheet ID
curl "https://YOUR_SERVICE_URL/file-cabinet?tab=YourTabName&sheetId=YourCustomSheetId"
```

### Access Interactive Documentation

After deployment, the API provides interactive Swagger UI documentation:

**Swagger UI**: `https://YOUR_SERVICE_URL/api-docs`
- Interactive API testing interface
- Complete endpoint documentation
- Request/response examples
- Parameter validation

**OpenAPI JSON**: `https://YOUR_SERVICE_URL/openapi.json`
- Machine-readable API specification
- Can be imported into API testing tools
- Supports automatic client code generation

### Features Available in Swagger UI:
- **Try It Out**: Test endpoints directly from the documentation
- **Request Examples**: Copy-paste ready curl commands
- **Response Schemas**: Complete data structure documentation
- **Error Examples**: All possible error responses documented
- **Parameter Validation**: Real-time parameter validation and hints

### View Logs

```bash
gcloud run logs tail file-cabinet-api --region us-central1
```

### Update Deployment

After making code changes:

```bash
# Rebuild and push
docker build -t file-cabinet-api .
docker tag file-cabinet-api gcr.io/YOUR_PROJECT_ID/file-cabinet-api
docker push gcr.io/YOUR_PROJECT_ID/file-cabinet-api

# Deploy new version
gcloud run deploy file-cabinet-api \
  --image gcr.io/YOUR_PROJECT_ID/file-cabinet-api \
  --platform managed \
  --region us-central1
```

### Set Up Monitoring

1. Go to **Cloud Monitoring** in the Google Cloud Console
2. Create alerts for:
   - High error rates (>5% 5xx responses)
   - High latency (>2s response time)
   - Container restarts

## 8. Security Considerations

- The API is intentionally public (no authentication required)
- Service account has minimal permissions (Sheets viewer only)
- No write operations are possible
- Consider setting up Cloud Armor for DDoS protection if needed
- Monitor usage patterns and set up quotas if necessary

## 9. Cost Optimization

- Cloud Run scales to zero when not in use (no charges for idle time)
- First 2 million requests per month are free
- Consider setting `--max-instances` based on expected traffic
- Monitor billing and set up budget alerts

## 10. Troubleshooting

### Common Issues

1. **"FILE_CABINET_SHEET_ID environment variable not set"**
   - Ensure the environment variable is properly set in Cloud Run

2. **"Tab 'TabName' not found"**
   - Verify the tab name matches exactly (case-sensitive)
   - Check that the spreadsheet has the tab

3. **"Permission denied"**
   - Verify service account has Viewer access to the spreadsheet
   - Check that the service account email is correct

4. **"Invalid spreadsheet format"**
   - Ensure headers match exactly: Event Name, Event Link, Start Date, End Date
   - Headers must be in row 1

### Debug Mode

For troubleshooting, you can enable more verbose logging by setting:

```bash
gcloud run services update file-cabinet-api \
  --set-env-vars NODE_ENV=development \
  --region us-central1
```

## API Usage Examples

### Get All Events from "Leagues" Tab

```bash
curl "https://your-cloud-run-url/file-cabinet?tab=Leagues"
```

### Get Only Current Events

```bash
curl "https://your-cloud-run-url/file-cabinet?tab=Leagues&dateFilter=current"
```

### Get Future Events with Date Override

```bash
curl "https://your-cloud-run-url/file-cabinet?tab=Leagues&dateFilter=future&today=2025-12-23"
```

### Use ETags for Caching

```bash
# First request
curl -I "https://your-cloud-run-url/file-cabinet?tab=Leagues"
# Note the ETag header

# Subsequent request with ETag
curl -H 'If-None-Match: "abc123def456"' "https://your-cloud-run-url/file-cabinet?tab=Leagues"
# Returns 304 Not Modified if data hasn't changed
```

This completes the deployment setup for your File Cabinet Public API!
