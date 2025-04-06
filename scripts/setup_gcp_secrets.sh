#!/bin/bash
# Script to set up Google Cloud Secret Manager secrets for KiloKōkua deployment

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

# Enable Secret Manager API if not already enabled
echo "Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com

# Function to create or update a secret
create_secret() {
    local name=$1
    local prompt=$2
    local default=$3
    
    # Check if secret exists
    if gcloud secrets describe $name --project=$PROJECT_ID &> /dev/null; then
        read -p "Secret '$name' already exists. Update it? (y/n): " update
        if [[ $update != "y" ]]; then
            echo "Skipping $name"
            return
        fi
    fi
    
    # Get value from user
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        value=${value:-$default}
    else
        read -p "$prompt: " value
    fi
    
    # Create or update secret
    echo "Creating/updating secret: $name"
    echo -n "$value" | gcloud secrets create $name --data-file=- --replication-policy="automatic" --project=$PROJECT_ID 2>/dev/null || \
    echo -n "$value" | gcloud secrets versions add $name --data-file=- --project=$PROJECT_ID
}

# Create necessary secrets
echo "Setting up secrets for KiloKōkua deployment..."

# Database password
create_secret "db-password" "Enter database password" "$(openssl rand -base64 16)"

# JWT secret key
create_secret "jwt-secret" "Enter JWT secret key" "$(openssl rand -base64 32)"

# Database host
create_secret "db-host" "Enter Cloud SQL connection name (e.g., project:region:instance)" "$PROJECT_ID:us-central1:kilokokua-db"

echo "Secrets setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a Cloud SQL instance if you haven't already:"
echo "   gcloud sql instances create kilokokua-db --database-version=POSTGRES_13 --tier=db-f1-micro --region=us-central1"
echo ""
echo "2. Create a database:"
echo "   gcloud sql databases create kilokokua --instance=kilokokua-db"
echo ""
echo "3. Deploy using Cloud Build:"
echo "   gcloud builds submit --config=cloudbuild.yaml"
echo ""
echo "For more details, refer to the DEPLOYMENT.md guide."
