# 🚀 Quick Production Setup Guide

Follow these steps to deploy your File Cabinet API to production:

## Step 1: Prepare Your Environment

### Required Tools
- ✅ Google Cloud SDK (gcloud) - Already installed
- ✅ Node.js and npm - Already installed  
- ⚠️ Docker - Just installed (you may need to start Docker Desktop)

### Start Docker Desktop
1. Open Docker Desktop application
2. Wait for it to start completely (you'll see a green indicator)

## Step 2: Set Up Google Cloud

### Authenticate and Set Project
```bash
# Login to Google Cloud
gcloud auth login

# Set your project (replace with your project ID)
gcloud config set project YOUR_PROJECT_ID

# Verify setup
gcloud config get-value project
gcloud auth list
```

## Step 3: Prepare Your Google Sheets

### Create Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin > Service Accounts**
3. Click **Create Service Account**
4. Name: `file-cabinet-api`
5. Description: `Service account for File Cabinet API`
6. Click **Create and Continue** → Skip roles → **Done**

### Get Service Account Email
1. Find your service account in the list
2. Copy the email address (ends with `.iam.gserviceaccount.com`)

### Share Your Spreadsheet
1. Open your Google Sheets spreadsheet
2. Click **Share**
3. Add the service account email
4. Set permission to **Viewer**
5. Click **Send**

### Verify Spreadsheet Format
Make sure your spreadsheet has exactly these headers in row 1:

| Event Name | Event Link | Start Date | End Date |
|------------|------------|------------|----------|

## Step 4: Get Your Spreadsheet ID

From your Google Sheets URL:
`https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`

Copy the long string between `/d/` and `/edit` - this is your **FILE_CABINET_SHEET_ID**

## Step 5: Deploy to Production

### Automatic Deployment (Recommended)
```bash
# Make sure you're in the project directory
cd /Users/adambrzyski/Documents/projects/FileCabinetAPI

# Run the deployment script
./deploy.sh
```

### Manual Deployment (If script doesn't work)
```bash
# 1. Set environment variable
export FILE_CABINET_SHEET_ID="your_spreadsheet_id_here"
export PROJECT_ID=$(gcloud config get-value project)

# 2. Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 3. Configure Docker
gcloud auth configure-docker

# 4. Build and push image
docker build -t file-cabinet-api .
docker tag file-cabinet-api gcr.io/$PROJECT_ID/file-cabinet-api
docker push gcr.io/$PROJECT_ID/file-cabinet-api

# 5. Deploy to Cloud Run
gcloud run deploy file-cabinet-api \
  --image gcr.io/$PROJECT_ID/file-cabinet-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FILE_CABINET_SHEET_ID=$FILE_CABINET_SHEET_ID \
  --memory 512Mi \
  --concurrency 100 \
  --max-instances 10
```

## Step 6: Test Your API

After deployment, you'll get a service URL. Test it:

```bash
# Health check
curl https://YOUR_SERVICE_URL/health

# Get events (replace TAB_NAME with your actual tab name)
curl "https://YOUR_SERVICE_URL/file-cabinet?tab=TAB_NAME"

# Get only future events
curl "https://YOUR_SERVICE_URL/file-cabinet?tab=TAB_NAME&dateFilter=future"
```

## Troubleshooting

### Common Issues:

1. **Docker not running**
   - Start Docker Desktop and wait for it to initialize

2. **Authentication errors**
   - Run `gcloud auth login` and `gcloud auth application-default login`

3. **Spreadsheet access denied**
   - Verify service account email is shared with Viewer permission
   - Check spreadsheet ID is correct

4. **Tab not found**
   - Verify tab name matches exactly (case-sensitive)
   - Ensure spreadsheet has the correct column headers

### View Logs:
```bash
gcloud run logs tail file-cabinet-api --region us-central1
```

## Next Steps

Once deployed:
1. **Monitor Usage**: Set up Cloud Monitoring alerts
2. **Custom Domain**: Optionally set up a custom domain
3. **CI/CD**: Set up automated deployments with GitHub Actions

Your API will be live and publicly accessible! 🎉
