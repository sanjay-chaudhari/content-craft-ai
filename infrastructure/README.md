# ContentCraft AI — Infrastructure (AWS CDK)

AWS CDK (Python) stack for deploying the ContentCraft AI serverless backend.

## Project Structure

```
infrastructure/
├── reelcraft_stack.py      # Main CDK stack — wires all constructs
└── constructs/
    ├── api.py              # API Gateway + Cognito authorizer
    ├── auth.py             # Cognito User Pool + Identity Pool
    ├── compute.py          # Lambda functions + IAM permissions
    ├── storage.py          # DynamoDB + S3 buckets
    ├── notifications.py    # SNS topic
    └── email_subscription.py  # Subscribe/unsubscribe Lambda
```

## AWS Resources Created

| Resource | Purpose |
|----------|---------|
| API Gateway (REST) | `/reel_generation`, `/job_status/{id}`, `/jobs`, `/plan`, `/subscribe` |
| Lambda × 5 | submit, process, status, list_jobs, director, subscribe |
| DynamoDB | Job tracking with `UserIdIndex` GSI and DynamoDB Streams |
| S3 × 2 | Video storage + image upload |
| Cognito User Pool | Auth — admin-created users only (self-signup disabled) |
| Cognito Identity Pool | AWS credentials for authenticated users |
| Amazon Bedrock (Nova Pro) | Director Agent — `amazon.nova-pro-v1:0` |
| Amazon Bedrock (Nova Reel) | Video generation — `amazon.nova-reel-v1:1` |
| Amazon SES | HTML email notifications on job completion |
| Amazon SNS | Job completion topic with user-specific filter policies |

## Deployment

### Prerequisites

- AWS CLI configured
- Python 3.8+
- Node.js 14+ (for CDK CLI)
- CDK v2: `npm install -g aws-cdk`
- Bedrock model access enabled for `amazon.nova-reel-v1:1` and `amazon.nova-pro-v1:0`
- SES verified sender email

### Steps

```bash
# Install dependencies
pip install -r requirements.txt

# Bootstrap CDK (first time only)
cdk bootstrap

# Set required environment variable
export SES_SENDER_EMAIL=your-verified-email@example.com

# Deploy
cdk deploy
```

### Stack Outputs

After deployment, note these values for the frontend `.env`:

| Output | Frontend Variable |
|--------|------------------|
| `ContentCraftStack.ApiGatewayEndpoint` | `VITE_API_ENDPOINT` |
| `ContentCraftStack.UserPoolId` | `VITE_COGNITO_USER_POOL_ID` |
| `ContentCraftStack.UserPoolClientId` | `VITE_COGNITO_USER_POOL_CLIENT_ID` |
| `ContentCraftStack.IdentityPoolId` | `VITE_COGNITO_IDENTITY_POOL_ID` |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SES_SENDER_EMAIL` | Verified SES email used as notification sender |
| `CDK_DEFAULT_ACCOUNT` | AWS account ID (optional, defaults to current) |
| `CDK_DEFAULT_REGION` | AWS region (optional, defaults to current) |

## Creating a Cognito User

Self-signup is disabled. Create users via CLI after deployment:

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <user-pool-id> \
  --username <username> \
  --user-attributes Name=email,Value=<email> \
  --temporary-password <temp-password> \
  --region us-east-1
```

## Teardown

```bash
cdk destroy
```

> S3 buckets with content may need manual deletion from the AWS console.
