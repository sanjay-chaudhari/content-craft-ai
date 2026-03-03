#!/bin/bash
# ReelCraft AI CloudFormation Deployment Script
# This script packages and deploys the ReelCraft AI application using CloudFormation

set -e

# Configuration
STACK_NAME="ReelCraftStack"
TEMPLATE_FILE="$(dirname "$0")/ReelCraftStack-Complete.yaml"
REGION=$(aws configure get region)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
CODE_BUCKET="reelcraft-deployment-code-${ACCOUNT_ID}-${REGION}"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "=== ReelCraft AI Deployment ==="
echo "Project Root: $PROJECT_ROOT"
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"
echo "Code Bucket: $CODE_BUCKET"

# Check if the code bucket exists, if not create it
if ! aws s3api head-bucket --bucket "$CODE_BUCKET" 2>/dev/null; then
    echo "Creating code bucket: $CODE_BUCKET"
    aws s3 mb "s3://$CODE_BUCKET"
    aws s3api put-bucket-versioning --bucket "$CODE_BUCKET" --versioning-configuration Status=Enabled
else
    echo "Code bucket already exists"
fi

# Package Lambda functions
echo "Packaging Lambda functions..."

# Create temporary directory for packaging
mkdir -p .lambda-packages

# Package Submit Job Lambda
echo "Packaging Submit Job Lambda..."
cd "$PROJECT_ROOT/nova-reel/lambda/submit"
zip -r "$PROJECT_ROOT/.lambda-packages/submit_job.zip" submit.py
cd "$PROJECT_ROOT"
aws s3 cp .lambda-packages/submit_job.zip "s3://$CODE_BUCKET/submit_job.zip"

# Package Process Job Lambda
echo "Packaging Process Job Lambda..."
cd "$PROJECT_ROOT/nova-reel/lambda/process"
zip -r "$PROJECT_ROOT/.lambda-packages/process_job.zip" process.py
cd "$PROJECT_ROOT"
aws s3 cp .lambda-packages/process_job.zip "s3://$CODE_BUCKET/process_job.zip"

# Package Check Status Lambda
echo "Packaging Check Status Lambda..."
cd "$PROJECT_ROOT/nova-reel/lambda/status"
zip -r "$PROJECT_ROOT/.lambda-packages/check_status.zip" status.py
cd "$PROJECT_ROOT"
aws s3 cp .lambda-packages/check_status.zip "s3://$CODE_BUCKET/check_status.zip"

echo "All Lambda packages uploaded to S3"

# Check if stack exists
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" 2>/dev/null; then
    # Update existing stack
    echo "Updating existing stack: $STACK_NAME"
    aws cloudformation update-stack \
        --stack-name "$STACK_NAME" \
        --template-body "file://$TEMPLATE_FILE" \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --parameters \
            ParameterKey=CodeBucketName,ParameterValue="reelcraft-deployment-code"
    
    echo "Waiting for stack update to complete..."
    aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME"
else
    # Create new stack
    echo "Creating new stack: $STACK_NAME"
    aws cloudformation create-stack \
        --stack-name "$STACK_NAME" \
        --template-body "file://$TEMPLATE_FILE" \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --parameters \
            ParameterKey=CodeBucketName,ParameterValue="reelcraft-deployment-code"
    
    echo "Waiting for stack creation to complete..."
    aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME"
fi

# Output stack information
echo "=== Deployment Complete ==="
echo "Stack outputs:"
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs" \
    --output table

# Clean up temporary files
rm -rf .lambda-packages

echo "ReelCraft AI deployment completed successfully!"
