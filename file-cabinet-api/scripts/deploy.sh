#!/bin/bash

# File Cabinet API - Production Deployment Script
# This script guides you through deploying the API to Google Cloud Run

set -e

echo "🚀 File Cabinet API Production Deployment"
echo "========================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}📋 Step: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
print_step "Checking prerequisites"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud SDK (gcloud) is not installed"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    echo "Install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

print_success "Prerequisites check passed"

# Get Google Cloud project
print_step "Checking Google Cloud configuration"

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    echo "No Google Cloud project is set. Please run:"
    echo "gcloud auth login"
    echo "gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

print_success "Using Google Cloud project: $PROJECT_ID"

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "Not authenticated with Google Cloud"
    echo "Please run: gcloud auth login"
    exit 1
fi

print_success "Google Cloud authentication verified"

# Prompt for spreadsheet ID
print_step "Getting spreadsheet configuration"

if [ -z "$FILE_CABINET_SHEET_ID" ]; then
    echo "Enter your Google Sheets spreadsheet ID:"
    echo "(This is the long string in the URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit)"
    read -p "Spreadsheet ID: " FILE_CABINET_SHEET_ID
fi

if [ -z "$FILE_CABINET_SHEET_ID" ]; then
    print_error "Spreadsheet ID is required"
    exit 1
fi

print_success "Using spreadsheet ID: $FILE_CABINET_SHEET_ID"

# Enable required APIs
print_step "Enabling required Google Cloud APIs"

echo "Enabling Cloud Run API..."
gcloud services enable run.googleapis.com --quiet

echo "Enabling Container Registry API..."
gcloud services enable containerregistry.googleapis.com --quiet

echo "Enabling Cloud Build API..."
gcloud services enable cloudbuild.googleapis.com --quiet

print_success "Required APIs enabled"

# Configure Docker for Google Cloud
print_step "Configuring Docker for Google Cloud"
gcloud auth configure-docker --quiet
print_success "Docker configured for Google Cloud"

# Build Docker image
print_step "Building Docker image"

IMAGE_NAME="gcr.io/$PROJECT_ID/file-cabinet-api"
echo "Building image: $IMAGE_NAME"

# Build for linux/amd64 platform (required for Cloud Run)
if ! docker build --platform linux/amd64 -t file-cabinet-api .; then
    print_error "Docker build failed"
    exit 1
fi

docker tag file-cabinet-api "$IMAGE_NAME"
print_success "Docker image built and tagged"

# Push to Container Registry
print_step "Pushing image to Google Container Registry"

if ! docker push "$IMAGE_NAME"; then
    print_error "Failed to push image to registry"
    exit 1
fi

print_success "Image pushed to registry"

# Deploy to Cloud Run
print_step "Deploying to Google Cloud Run"

SERVICE_NAME="file-cabinet-api"
REGION="us-central1"

echo "Deploying service: $SERVICE_NAME"
echo "Region: $REGION"

if ! gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_NAME" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --set-env-vars "FILE_CABINET_SHEET_ID=$FILE_CABINET_SHEET_ID" \
    --memory 512Mi \
    --concurrency 100 \
    --max-instances 10 \
    --quiet; then
    print_error "Cloud Run deployment failed"
    exit 1
fi

print_success "Successfully deployed to Cloud Run"

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format="value(status.url)")

echo
echo "🎉 Deployment Complete!"
echo "======================"
echo
echo "Service URL: $SERVICE_URL"
echo
echo "Test your API:"
echo "Health check: curl $SERVICE_URL/health"
echo "API endpoint: curl \"$SERVICE_URL/file-cabinet?tab=YOUR_TAB_NAME\""
echo
echo "📋 Next Steps:"
echo "1. Make sure your Google Sheets has the correct format (see README.md)"
echo "2. Test the API endpoints"
echo "3. Monitor logs: gcloud run logs tail $SERVICE_NAME --region $REGION"
echo
print_warning "Remember: Your spreadsheet must have these exact headers:"
echo "   Event Name | Event Link | Start Date | End Date"
echo
