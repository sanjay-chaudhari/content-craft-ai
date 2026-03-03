# ContentCraft AI Lambda Functions

This directory contains the AWS Lambda functions that power the ContentCraft AI backend services. Each function is designed to handle specific aspects of the content generation workflow.

## Lambda Functions Overview

### 1. Submit Function (`submit/`)
**Purpose**: Handles content generation job submissions
- Validates input parameters (prompts, images, generation modes)
- Creates job records in DynamoDB
- Initiates video generation process
- Supports multiple generation modes:
  - Single clip (6 seconds)
  - Automated multi-clip (12-120 seconds)
  - Manual multi-clip with custom shots

**Key Features**:
- Input validation and sanitization
- Image upload handling to S3
- Job queuing and tracking
- Error handling and logging

### 2. Process Function (`process/`)
**Purpose**: Processes video generation jobs asynchronously
- Retrieves job details from DynamoDB
- Calls Amazon Bedrock Nova model for video generation
- Handles different generation modes and parameters
- Updates job status throughout the process
- Stores generated videos in S3

**Key Features**:
- Bedrock Nova model integration
- Multi-clip video processing
- Progress tracking and status updates
- Error recovery and retry logic
- S3 video storage and URL generation

### 3. Status Function (`status/`)
**Purpose**: Provides real-time job status information
- Retrieves current job status from DynamoDB
- Returns job progress and completion details
- Provides video URLs for completed jobs
- Handles status polling from frontend

**Key Features**:
- Real-time status updates
- Job progress tracking
- Video URL generation
- Error status reporting

### 4. List Jobs Function (`list_jobs/`)
**Purpose**: Lists all jobs for authenticated users
- Retrieves user-specific job history
- Supports pagination for large job lists
- Filters jobs by status and date
- Returns job metadata and status

**Key Features**:
- User-specific job filtering
- Pagination support
- Status-based filtering
- Chronological sorting
- Job metadata retrieval

### 5. Subscribe Function (`subscribe/`)
**Purpose**: Manages email notification subscriptions
- Handles subscription and unsubscription requests
- Manages user email preferences
- Integrates with SNS for email notifications
- Validates email addresses and user authentication

**Key Features**:
- Email subscription management
- SNS topic integration
- User preference storage
- Email validation
- Subscription status tracking

## Common Architecture Patterns

### Authentication & Authorization
All Lambda functions use:
- AWS Cognito User Pool for authentication
- JWT token validation
- User-specific data access controls
- IAM roles for AWS service access

### Error Handling
Consistent error handling across all functions:
- Structured error responses
- Detailed logging with CloudWatch
- Graceful degradation
- User-friendly error messages

### Data Storage
- **DynamoDB**: Job metadata, user preferences, status tracking
- **S3**: Video files, reference images, generated content
- **SNS**: Email notification delivery

### Monitoring & Logging
- CloudWatch Logs for detailed function logging
- CloudWatch Metrics for performance monitoring
- X-Ray tracing for distributed request tracking
- Custom metrics for business logic monitoring

## Deployment

These Lambda functions are deployed as part of the ReelCraft AI CDK stack. Each function includes:

- **Runtime**: Python 3.12
- **Memory**: Optimized per function requirements
- **Timeout**: Configured based on expected execution time
- **Environment Variables**: AWS service endpoints and configuration
- **IAM Roles**: Least-privilege access to required AWS services

## Environment Variables

Common environment variables used across functions:

| Variable | Description |
|----------|-------------|
| `DYNAMODB_TABLE` | DynamoDB table name for job storage |
| `S3_BUCKET` | S3 bucket for video and image storage |
| `SNS_TOPIC_ARN` | SNS topic for email notifications |
| `BEDROCK_REGION` | AWS region for Bedrock service |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID for authentication |

## Development

### Local Testing
Each function can be tested locally using:
```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
python -m pytest tests/

# Local invocation
sam local invoke FunctionName --event test-event.json
```

### Debugging
- Use CloudWatch Logs for runtime debugging
- Enable X-Ray tracing for distributed debugging
- Use local SAM CLI for development testing

## Security Considerations

- All functions validate user authentication
- Input sanitization prevents injection attacks
- Least-privilege IAM roles
- Encrypted data storage and transmission
- Secure handling of user-generated content

## Performance Optimization

- Connection pooling for database connections
- Efficient memory usage patterns
- Optimized cold start performance
- Asynchronous processing where appropriate
- Caching strategies for frequently accessed data

## Monitoring & Alerts

- CloudWatch alarms for error rates
- Performance metric tracking
- Custom business metric monitoring
- Automated alerting for critical failures
- Dashboard for operational visibility
