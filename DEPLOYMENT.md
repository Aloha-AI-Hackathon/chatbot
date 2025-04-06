# Deploying KiloKōkua to Google Cloud

This guide provides comprehensive instructions for deploying the KiloKōkua application to Google Cloud Platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Cloud Setup](#google-cloud-setup)
3. [Application Configuration](#application-configuration)
4. [Deployment Process](#deployment-process)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying to Google Cloud, ensure you have:

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and configured
- [Docker](https://docs.docker.com/get-docker/) installed locally
- [Git](https://git-scm.com/downloads) installed
- Access to a Google Cloud Platform account with billing enabled
- Basic familiarity with command line operations

## Google Cloud Setup

### 1. Create a Google Cloud Project

```bash
# Create a new project
gcloud projects create kilokokua-project --name="KiloKōkua Climate AI"

# Set the project as active
gcloud config set project kilokokua-project
```

### 2. Enable Required APIs

```bash
# Enable required Google Cloud APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable iam.googleapis.com
```

### 3. Set Up Service Account

```bash
# Create a service account for deployment
gcloud iam service-accounts create kilokokua-deployer \
  --display-name="KiloKōkua Deployment Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding kilokokua-project \
  --member="serviceAccount:kilokokua-deployer@kilokokua-project.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding kilokokua-project \
  --member="serviceAccount:kilokokua-deployer@kilokokua-project.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding kilokokua-project \
  --member="serviceAccount:kilokokua-deployer@kilokokua-project.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding kilokokua-project \
  --member="serviceAccount:kilokokua-deployer@kilokokua-project.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### 4. Set Up Cloud SQL (PostgreSQL)

```bash
# Create a PostgreSQL instance
gcloud sql instances create kilokokua-db \
  --database-version=POSTGRES_13 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password="STRONG_PASSWORD_HERE" \
  --storage-size=10GB

# Create a database
gcloud sql databases create kilokokua \
  --instance=kilokokua-db
```

### 5. Set Up Secret Manager for Environment Variables

The project includes a helper script to set up the required secrets in Google Cloud Secret Manager:

```bash
# Run the setup script
./scripts/setup_gcp_secrets.sh
```

This script will:
1. Check if you're logged in to gcloud
2. Enable the Secret Manager API if needed
3. Create the following secrets with secure default values:
   - `db-password`: Password for the PostgreSQL database
   - `jwt-secret`: Secret key for JWT token generation
   - `db-host`: Connection string for the Cloud SQL instance

If you prefer to set up the secrets manually:

```bash
# Create secrets for sensitive configuration
gcloud secrets create db-password --location="us-central1"
echo -n "YOUR_STRONG_PASSWORD" | gcloud secrets versions add db-password --data-file=-

gcloud secrets create jwt-secret --location="us-central1"
echo -n "YOUR_JWT_SECRET_KEY" | gcloud secrets versions add jwt-secret --data-file=-

gcloud secrets create db-host --location="us-central1"
echo -n "YOUR_PROJECT_ID:us-central1:kilokokua-db" | gcloud secrets versions add db-host --data-file=-
```

> **Important**: When creating secrets, do not specify the `--project` flag explicitly, as it may cause formatting issues with the project ID. The gcloud command will use your currently active project.

> **Note**: We use `--location="us-central1"` instead of `--replication-policy="automatic"` to comply with organization policies that may restrict where secrets can be stored. If your organization allows different regions, you may need to adjust this location.

> **Note**: Make sure to create these secrets before running the deployment, as they are required by the Cloud Build configuration.

## Application Configuration

### 1. Combined Dockerfile

The project now uses a single Dockerfile in the root directory that combines both frontend and backend into a single container. This simplifies deployment and ensures that the frontend and backend are always in sync.

The Dockerfile:
- Builds the React frontend
- Builds the Python backend
- Sets up Nginx to serve the frontend static files
- Configures Nginx to proxy API requests to the backend
- Runs both services in a single container

### 2. Frontend API Configuration

The frontend is configured to use a relative path for API requests:

```typescript
// In chatbot/src/services/api.ts:
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

With the `.env.production` file setting:

```
REACT_APP_API_URL=/api
```

This ensures that API requests are correctly proxied to the backend service running in the same container.

### 2. Update Backend Database Configuration

Create a `backend/app/config.py` file to handle different environments:

```python
import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# Environment
ENV = os.getenv("ENV", "development")

# Database configuration
if ENV == "production":
    # Cloud SQL configuration
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_NAME = os.getenv("DB_NAME", "kilokokua")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    
    # Construct the database URL
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
else:
    # SQLite for development
    DATABASE_URL = "sqlite:///./kilokokua.db"

# Google Cloud configuration
PROJECT_ID = os.getenv("PROJECT_ID")
LOCATION = os.getenv("LOCATION", "us-central1")

# API configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
```

Update `backend/app/database.py` to use this configuration.

### 3. Create a Cloud Build Configuration

The `cloudbuild.yaml` file is already set up, but you may need to update it with additional steps for database migrations or environment variable configuration.

## Deployment Process

### 1. Prepare Your Repository

Ensure all changes are committed to your Git repository:

```bash
git add .
git commit -m "Prepare for Google Cloud deployment"
```

### 2. Set Up Cloud Build Trigger

You can set up automatic deployments using Cloud Build triggers:

```bash
# Create a build trigger
gcloud builds triggers create github \
  --repo-name=your-repo-name \
  --repo-owner=your-github-username \
  --branch-pattern=main \
  --build-config=cloudbuild.yaml
```

Alternatively, you can manually trigger builds:

```bash
# Manually trigger a build
gcloud builds submit --config=cloudbuild.yaml
```

### 3. First Deployment

For the first deployment, run:

```bash
gcloud builds submit --config=cloudbuild.yaml
```

This will:
1. Build Docker images for both frontend and backend
2. Push the images to Google Container Registry
3. Deploy both services to Cloud Run

### 4. Update Frontend Configuration

After the first deployment, you'll get the actual URLs for your services. Update the `.env.production` file with the correct backend URL:

```
REACT_APP_API_URL=https://kilokokua-backend-[actual-hash].run.app
```

Then redeploy the frontend:

```bash
gcloud builds submit --config=cloudbuild.yaml
```

## Post-Deployment Configuration

### 1. Set Up Custom Domain (Optional)

```bash
# Map your domain to the application service
gcloud run domain-mappings create \
  --service=kilokokua-app \
  --domain=your-domain.com
```

### 2. Configure SSL Certificates (Automatic with Custom Domain)

Cloud Run automatically provisions SSL certificates for custom domains.

### 3. Set Up Cloud Scheduler for Regular Maintenance (Optional)

```bash
# Create a scheduler job for database backups
gcloud scheduler jobs create http db-backup \
  --schedule="0 0 * * *" \
  --uri="https://kilokokua-app-[hash].run.app/api/admin/backup" \
  --http-method=POST \
  --headers="Authorization=Bearer YOUR_SECRET_TOKEN"
```

## Monitoring and Maintenance

### 1. Set Up Logging and Monitoring

```bash
# View logs for the application service
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=kilokokua-app"
```

### 2. Set Up Alerts (Optional)

```bash
# Create an alert policy for high error rates
gcloud alpha monitoring policies create \
  --display-name="High Error Rate" \
  --condition-filter="resource.type=cloud_run_revision AND metric.type=run.googleapis.com/request_count AND metric.labels.response_code_class=4xx" \
  --condition-threshold-value=10 \
  --condition-threshold-duration=300s \
  --notification-channels=YOUR_NOTIFICATION_CHANNEL
```

### 3. Regular Database Backups

```bash
# Manually create a database backup
gcloud sql backups create --instance=kilokokua-db
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Deployment Failures

**Issue**: Cloud Build fails during deployment.

**Solution**: Check the Cloud Build logs:
```bash
gcloud builds list
gcloud builds log [BUILD_ID]
```

#### 2. Service Connectivity Issues

**Issue**: Frontend cannot connect to backend.

**Solution**: 
- Verify the API_BASE_URL is correct
- Check CORS configuration in the backend
- Ensure the backend service is set to allow unauthenticated access

#### 3. Database Connection Issues

**Issue**: Backend cannot connect to Cloud SQL.

**Solution**:
- Verify the database connection string
- Check if the Cloud SQL instance is running
- Ensure the service account has proper permissions

#### 4. Performance Issues

**Issue**: Slow response times.

**Solution**:
- Increase the minimum number of instances
- Adjust memory and CPU allocation
- Consider using Cloud CDN for the frontend

### Getting Help

If you encounter issues not covered here:

1. Check the [Google Cloud Run documentation](https://cloud.google.com/run/docs)
2. Review the [Cloud Build documentation](https://cloud.google.com/build/docs)
3. Search the [Google Cloud Community forums](https://www.googlecloudcommunity.com/)
4. Open an issue in the project repository
