#!/bin/bash
# Script to deploy KiloKōkua to Google Cloud

# Exit on error
set -e

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "You are not logged in to gcloud. Please login first."
    gcloud auth login
fi

# Get project ID
echo "Fetching current project..."
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "No project selected. Please select a project:"
    gcloud projects list
    read -p "Enter project ID: " PROJECT_ID
    gcloud config set project $PROJECT_ID
fi

echo "Using project: $PROJECT_ID"

# Function to check if an API is enabled
is_api_enabled() {
    local api=$1
    gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"
}

# Enable required APIs
echo "Checking and enabling required APIs..."
required_apis=(
    "cloudbuild.googleapis.com"
    "run.googleapis.com"
    "artifactregistry.googleapis.com"
    "secretmanager.googleapis.com"
    "aiplatform.googleapis.com"
    "cloudresourcemanager.googleapis.com"
    "iam.googleapis.com"
    "sqladmin.googleapis.com"
)

for api in "${required_apis[@]}"; do
    if ! is_api_enabled "$api"; then
        echo "Enabling $api..."
        gcloud services enable $api
    else
        echo "$api is already enabled."
    fi
done

# Check if secrets exist
echo "Checking if required secrets exist..."
required_secrets=("db-password" "jwt-secret" "db-host")
missing_secrets=()

for secret in "${required_secrets[@]}"; do
    if ! gcloud secrets describe $secret --project=$PROJECT_ID &> /dev/null; then
        missing_secrets+=($secret)
    fi
done

if [ ${#missing_secrets[@]} -gt 0 ]; then
    echo "The following required secrets are missing:"
    for secret in "${missing_secrets[@]}"; do
        echo "- $secret"
    done
    echo "Please run the setup_gcp_secrets.sh script first."
    exit 1
fi

# Check if Cloud SQL instance exists
echo "Checking if Cloud SQL instance exists..."
DB_HOST=$(gcloud secrets versions access latest --secret=db-host)
DB_INSTANCE=$(echo $DB_HOST | cut -d':' -f3)

if ! gcloud sql instances describe $DB_INSTANCE &> /dev/null; then
    echo "Cloud SQL instance '$DB_INSTANCE' does not exist."
    read -p "Would you like to create it now? (y/n): " create_db
    if [[ $create_db == "y" ]]; then
        echo "Creating Cloud SQL instance..."
        gcloud sql instances create $DB_INSTANCE \
            --database-version=POSTGRES_13 \
            --tier=db-f1-micro \
            --region=us-central1 \
            --root-password="$(gcloud secrets versions access latest --secret=db-password)" \
            --storage-size=10GB
        
        echo "Creating database..."
        gcloud sql databases create kilokokua --instance=$DB_INSTANCE
    else
        echo "Please create the Cloud SQL instance manually and try again."
        exit 1
    fi
fi

# Deploy using Cloud Build
echo "Starting deployment with Cloud Build..."
gcloud builds submit --config=cloudbuild.yaml

# Wait for deployment to complete
echo "Deployment started. Waiting for completion..."
sleep 10

# Get service URLs
echo "Fetching service URLs..."
BACKEND_URL=$(gcloud run services describe kilokokua-backend --format="value(status.url)")
FRONTEND_URL=$(gcloud run services describe kilokokua-frontend --format="value(status.url)")

echo "Deployment completed!"
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo "You can access the application at: $FRONTEND_URL"
echo ""
echo "For more information and post-deployment steps, refer to the DEPLOYMENT.md guide."
