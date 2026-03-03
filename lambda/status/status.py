"""
Lambda function for checking the status of video generation jobs.

This module handles status check requests, including:
- Retrieving job information from DynamoDB
- Filtering results based on user authentication
- Formatting responses with proper error handling
- Converting Decimal types to standard JSON types
"""

import json
import os
import boto3
from decimal import Decimal
from typing import Dict, Any, Optional

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])


class DecimalEncoder(json.JSONEncoder):
    """
    Custom JSON encoder to handle Decimal types from DynamoDB.
    
    This encoder converts Decimal objects to float for proper JSON serialization.
    """
    def default(self, obj):
        """Convert Decimal to float for JSON serialization."""
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def check_job_status_handler(event, context) -> Dict[str, Any]:
    """
    Lambda handler for job status check requests.
    
    Args:
        event (dict): API Gateway event
        context (object): Lambda context
        
    Returns:
        dict: API Gateway response with job status information
    """
    try:
        # Extract job ID from path parameters
        job_id = event['pathParameters']['jobId']
        
        # Extract user information from the request context
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})
        claims = authorizer.get('claims', {})
        
        # Get user ID from Cognito claims
        user_id = claims.get('sub')
        
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                    'Access-Control-Allow-Methods': 'GET,OPTIONS',
                    'Access-Control-Allow-Credentials': 'true'
                },
                'body': json.dumps({'error': 'User authentication required'})
            }
        
        # Query DynamoDB for job information
        response = table.get_item(Key={'job_id': job_id})
        
        # Check if job exists
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                    'Access-Control-Allow-Methods': 'GET,OPTIONS',
                    'Access-Control-Allow-Credentials': 'true'
                },
                'body': json.dumps({'error': 'Job not found'})
            }

        item = response['Item']
        
        # Check if the job belongs to the authenticated user
        if item.get('user_id') != user_id:
            return {
                'statusCode': 403,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                    'Access-Control-Allow-Methods': 'GET,OPTIONS',
                    'Access-Control-Allow-Credentials': 'true'
                },
                'body': json.dumps({'error': 'You do not have permission to access this job'})
            }

        # Return job information with CORS headers
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                'Access-Control-Allow-Methods': 'GET,OPTIONS',
                'Access-Control-Allow-Credentials': 'true'
            },
            'body': json.dumps(item, cls=DecimalEncoder)
        }
    except Exception as e:
        # Handle exceptions with CORS headers
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                'Access-Control-Allow-Methods': 'GET,OPTIONS',
                'Access-Control-Allow-Credentials': 'true'
            },
            'body': json.dumps({'error': str(e)})
        }
