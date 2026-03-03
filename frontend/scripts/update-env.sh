#!/bin/bash

# Script to update environment variables from CDK outputs
# Usage: ./scripts/update-env.sh [stack-name]

# Default stack name
STACK_NAME=${1:-"ReelCraftStack"}

echo "Fetching outputs from CloudFormation stack: $STACK_NAME"

# Get CDK outputs
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)
IDENTITY_POOL_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='IdentityPoolId'].OutputValue" --output text)
API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayEndpoint'].OutputValue" --output text)
REGION=$(aws configure get region)

# Check if all values were retrieved
if [ -z "$USER_POOL_ID" ] || [ -z "$USER_POOL_CLIENT_ID" ] || [ -z "$IDENTITY_POOL_ID" ] || [ -z "$API_ENDPOINT" ]; then
  echo "Error: Failed to retrieve one or more required outputs from CloudFormation stack."
  echo "Make sure the stack '$STACK_NAME' exists and has deployed successfully."
  exit 1
fi

# Create .env file
cat > .env << EOF
# AWS Region
VITE_AWS_REGION=$REGION

# Cognito Configuration
VITE_COGNITO_USER_POOL_ID=$USER_POOL_ID
VITE_COGNITO_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
VITE_COGNITO_IDENTITY_POOL_ID=$IDENTITY_POOL_ID

# API Gateway Endpoint
VITE_API_ENDPOINT=$API_ENDPOINT
EOF

echo "Environment variables updated successfully!"
echo ""
echo "Configuration:"
echo "  Region: $REGION"
echo "  User Pool ID: $USER_POOL_ID"
echo "  User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "  Identity Pool ID: $IDENTITY_POOL_ID"
echo "  API Endpoint: $API_ENDPOINT"
echo ""
echo "You can now start the application with: npm start"
