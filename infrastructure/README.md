# ReelCraft AI Infrastructure (AWS CDK)

This directory contains the AWS CDK (Cloud Development Kit) infrastructure code for deploying the ReelCraft AI application. The infrastructure is defined using Python and creates all necessary AWS resources for a fully functional serverless video generation platform.

## Architecture Overview

The CDK stack creates a comprehensive serverless architecture including:

- **API Gateway**: RESTful API endpoints with Cognito authorization
- **Lambda Functions**: Serverless compute for video processing and job management
- **DynamoDB**: NoSQL database for job tracking and user data
- **S3 Buckets**: Storage for videos, images, and static assets
- **Cognito**: User authentication and authorization
- **SNS**: Email notification system
- **CloudWatch**: Monitoring and logging
- **IAM**: Security roles and policies

## Project Structure

```
infrastructure/
├── reelcraft_stack.py          # Main CDK stack definition
├── constructs/                 # Custom CDK constructs
│   ├── api_construct.py        # API Gateway and Lambda integration
│   ├── auth_construct.py       # Cognito authentication setup
│   ├── storage_construct.py    # S3 and DynamoDB resources
│   └── monitoring_construct.py # CloudWatch and alerting
├── cloudformation/             # CloudFormation deployment alternative
│   ├── ReelCraftStack-Complete.yaml
│   └── deploy-reelcraft.sh
└── README.md                   # This file
```

## Key Components

### 1. Main Stack (`reelcraft_stack.py`)
The primary CDK stack that orchestrates all infrastructure components:

- **Resource Organization**: Logical grouping of related AWS resources
- **Cross-Stack References**: Manages dependencies between components
- **Environment Configuration**: Handles different deployment environments
- **Output Values**: Provides necessary values for frontend configuration

### 2. API Construct (`constructs/api_construct.py`)
Defines the API Gateway and Lambda function integration:

- **REST API**: Creates API Gateway with proper CORS configuration
- **Lambda Integration**: Connects API endpoints to Lambda functions
- **Authorization**: Integrates Cognito User Pool authorizers
- **Request/Response Mapping**: Handles API request and response transformations

**API Endpoints**:
- `POST /submit` - Submit video generation jobs
- `GET /status/{jobId}` - Get job status
- `GET /jobs` - List user jobs (with pagination)
- `POST /subscribe` - Manage email subscriptions
- `DELETE /subscribe` - Unsubscribe from notifications

### 3. Authentication Construct (`constructs/auth_construct.py`)
Sets up Cognito-based authentication:

- **User Pool**: Manages user registration and authentication
- **User Pool Client**: Frontend application integration
- **Identity Pool**: Provides AWS credentials for authenticated users
- **Password Policies**: Enforces strong password requirements
- **Email Verification**: Requires email verification for new accounts

### 4. Storage Construct (`constructs/storage_construct.py`)
Manages data storage resources:

- **DynamoDB Table**: Stores job metadata and user preferences
  - Partition Key: `user_id`
  - Sort Key: `job_id`
  - Global Secondary Indexes for efficient querying
- **S3 Buckets**: 
  - Video storage bucket with lifecycle policies
  - Image upload bucket with CORS configuration
  - Static website hosting (optional)

### 5. Monitoring Construct (`constructs/monitoring_construct.py`)
Implements observability and alerting:

- **CloudWatch Dashboards**: Visual monitoring of key metrics
- **CloudWatch Alarms**: Automated alerting for critical issues
- **Log Groups**: Centralized logging for all Lambda functions
- **Custom Metrics**: Business-specific monitoring metrics

## Deployment

### Prerequisites

1. **AWS CLI**: Configured with appropriate credentials
2. **AWS CDK**: Version 2.x installed globally
3. **Python**: Version 3.8 or higher
4. **Node.js**: For CDK CLI (version 14.x or higher)

### Installation

1. Install CDK CLI:
   ```bash
   npm install -g aws-cdk
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Bootstrap CDK (first time only):
   ```bash
   cdk bootstrap
   ```

### Deployment Commands

1. **Synthesize CloudFormation**:
   ```bash
   cdk synth
   ```

2. **Deploy Stack**:
   ```bash
   cdk deploy
   ```

3. **Destroy Stack**:
   ```bash
   cdk destroy
   ```

### Environment Configuration

The stack supports multiple deployment environments through context variables:

```bash
# Development deployment
cdk deploy --context environment=dev

# Production deployment
cdk deploy --context environment=prod
```

## Configuration Options

### Environment Variables
Set these in your deployment environment:

| Variable | Description | Default |
|----------|-------------|---------|
| `CDK_DEFAULT_ACCOUNT` | AWS Account ID | Current account |
| `CDK_DEFAULT_REGION` | AWS Region | us-east-1 |
| `ENVIRONMENT` | Deployment environment | dev |

### Stack Parameters
Customize deployment through CDK context:

```json
{
  "environment": "prod",
  "enableMonitoring": true,
  "retentionDays": 30,
  "enableBackup": true
}
```

## Security Features

### IAM Roles and Policies
- **Least Privilege**: Each Lambda function has minimal required permissions
- **Resource-Based Policies**: S3 and DynamoDB access controls
- **Cross-Service Access**: Secure integration between AWS services

### Data Protection
- **Encryption at Rest**: DynamoDB and S3 encryption enabled
- **Encryption in Transit**: HTTPS/TLS for all API communications
- **Access Logging**: Comprehensive audit trails

### Network Security
- **VPC Integration**: Optional VPC deployment for enhanced isolation
- **Security Groups**: Network-level access controls
- **API Gateway Throttling**: Rate limiting and DDoS protection

## Monitoring and Observability

### CloudWatch Integration
- **Metrics**: Custom and AWS service metrics
- **Logs**: Centralized logging with retention policies
- **Alarms**: Automated alerting for operational issues
- **Dashboards**: Visual monitoring interfaces

### Key Metrics Monitored
- API Gateway request rates and errors
- Lambda function duration and errors
- DynamoDB read/write capacity and throttling
- S3 storage utilization and access patterns

## Cost Optimization

### Resource Optimization
- **Lambda Memory**: Right-sized based on function requirements
- **DynamoDB**: On-demand billing for variable workloads
- **S3 Lifecycle**: Automated transition to cheaper storage classes
- **CloudWatch**: Log retention policies to manage costs

### Cost Monitoring
- **AWS Cost Explorer**: Integration for cost tracking
- **Budget Alerts**: Automated cost threshold notifications
- **Resource Tagging**: Detailed cost allocation tracking

## Troubleshooting

### Common Issues

1. **Bootstrap Required**:
   ```bash
   cdk bootstrap aws://ACCOUNT-NUMBER/REGION
   ```

2. **Permission Errors**:
   - Verify AWS credentials and permissions
   - Check IAM roles and policies

3. **Resource Conflicts**:
   - Use unique stack names for multiple deployments
   - Check for existing resource name conflicts

### Debugging

1. **CloudFormation Events**: Check AWS Console for deployment events
2. **CDK Diff**: Compare changes before deployment
   ```bash
   cdk diff
   ```
3. **CloudWatch Logs**: Monitor Lambda function logs for runtime issues

## Best Practices

### Development
- Use CDK context for environment-specific configurations
- Implement proper error handling in custom constructs
- Follow AWS Well-Architected Framework principles

### Deployment
- Test in development environment before production
- Use CloudFormation change sets for production deployments
- Implement proper backup and disaster recovery procedures

### Security
- Regularly update CDK and dependencies
- Implement least-privilege access controls
- Enable AWS Config for compliance monitoring

## Support and Maintenance

### Updates
- Regularly update CDK version and dependencies
- Monitor AWS service updates and deprecations
- Test updates in non-production environments first

### Backup and Recovery
- DynamoDB point-in-time recovery enabled
- S3 versioning and cross-region replication
- CloudFormation stack backup procedures
