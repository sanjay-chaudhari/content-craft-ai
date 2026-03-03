"""
Lambda function for listing user-specific video generation jobs.

This module handles retrieving a list of jobs for the authenticated user, including:
- Querying DynamoDB using the UserIdIndex GSI
- Filtering results by user ID
- Sorting by creation date
- Pagination support
- Converting Decimal types to standard JSON types
"""

import json
import os
import boto3
from decimal import Decimal
from typing import Dict, Any, List

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])


def default_serializer(obj):
    """Helper function to serialize objects that are not JSON serializable by default."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def list_jobs_handler(event, context) -> Dict[str, Any]:
    """
    Lambda handler for listing user jobs.
    
    Args:
        event (dict): API Gateway event
        context (object): Lambda context
        
    Returns:
        dict: API Gateway response with list of jobs
    """
    try:
        # Log the incoming event for debugging
        print("Received event:", json.dumps(event))
        
        # Extract user information from the request context
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})
        claims = authorizer.get('claims', {})
        
        # Get user ID from Cognito claims
        user_id = claims.get('sub')
        
        print(f"Extracted user_id: {user_id}")
        
        if not user_id:
            print("No user_id found in claims")
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
        
        # Get query parameters for pagination
        query_params = event.get('queryStringParameters', {}) or {}
        limit = int(query_params.get('limit', '10'))
        last_evaluated_key = query_params.get('next_token')
        
        # Prepare query parameters
        query_params = {
            'IndexName': 'UserIdIndex',
            'KeyConditionExpression': 'user_id = :user_id',
            'ExpressionAttributeValues': {
                ':user_id': user_id
            },
            'ScanIndexForward': False,  # Sort by created_at in descending order (newest first)
            'Limit': limit
        }
        
        print(f"DynamoDB query parameters: {json.dumps(query_params, default=str)}")
        print(f"Table name: {os.environ['TABLE_NAME']}")
        
        # Add pagination token if provided
        if last_evaluated_key:
            try:
                # Parse the token and convert string numbers back to Decimal for DynamoDB
                exclusive_start_key = json.loads(last_evaluated_key)
                
                # Log the parsed token for debugging
                print(f"Parsed ExclusiveStartKey: {json.dumps(exclusive_start_key, default=str)}")
                
                # Convert numeric strings to Decimal if needed
                for key, value in exclusive_start_key.items():
                    if isinstance(value, str) and value.replace('.', '', 1).isdigit():
                        exclusive_start_key[key] = Decimal(value)
                
                # Log the converted token
                print(f"Converted ExclusiveStartKey: {json.dumps(exclusive_start_key, default=str)}")
                
                query_params['ExclusiveStartKey'] = exclusive_start_key
            except json.JSONDecodeError as e:
                print(f"Error parsing pagination token: {str(e)}")
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                        'Access-Control-Allow-Methods': 'GET,OPTIONS',
                        'Access-Control-Allow-Credentials': 'true'
                    },
                    'body': json.dumps({'error': 'Invalid pagination token'})
                }
        
        # Query DynamoDB for user's jobs
        try:
            print(f"Executing DynamoDB query with params: {json.dumps(query_params, default=str)}")
            response = table.query(**query_params)
            # Use default=str for logging to handle Decimal objects
            print(f"DynamoDB query response: {json.dumps(response, default=str)}")
        except Exception as query_error:
            print(f"DynamoDB query error: {str(query_error)}")
            import traceback
            print(traceback.format_exc())
            raise query_error
        
        # Prepare response
        result = {
            'jobs': response.get('Items', []),
            'count': len(response.get('Items', [])),
            'total': response.get('Count', 0)
        }
        
        # Add pagination token if more results exist
        if 'LastEvaluatedKey' in response:
            # Store the LastEvaluatedKey as is, preserving its structure
            # We'll convert it to the right format when it's used
            print(f"LastEvaluatedKey found: {json.dumps(response['LastEvaluatedKey'], default=str)}")
            
            # Create a copy of the LastEvaluatedKey to avoid modifying the original
            last_key = {}
            for key, value in response['LastEvaluatedKey'].items():
                if isinstance(value, Decimal):
                    # Convert Decimal to string to ensure it's preserved exactly
                    last_key[key] = str(value)
                else:
                    last_key[key] = value
            
            result['next_token'] = json.dumps(last_key)
        
        # Return job information with CORS headers
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                'Access-Control-Allow-Methods': 'GET,OPTIONS',
                'Access-Control-Allow-Credentials': 'true'
            },
            'body': json.dumps(result, default=default_serializer)
        }
    except Exception as e:
        # Handle exceptions with CORS headers
        print(f"Error in list_jobs_handler: {str(e)}")
        import traceback
        print(traceback.format_exc())
        
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
