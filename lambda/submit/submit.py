"""
Lambda function for submitting video generation jobs to the ReelCraft AI system.

This module handles the initial job submission process, including:
- Validating user input based on task type
- Creating job records in DynamoDB
- Processing and storing uploaded images in S3
- Returning job IDs and initial status to clients

The function supports three task types:
1. TEXT_VIDEO: Single 6-second video from text prompt with optional image
2. MULTI_SHOT_AUTOMATED: Longer video (12-120s) from a single comprehensive prompt
3. MULTI_SHOT_MANUAL: Multiple shots with individual prompts and optional images
"""

import json
import os
import uuid
import time
import base64
import boto3
from botocore.exceptions import NoCredentialsError

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])
s3_client = boto3.client('s3')
image_bucket = os.environ['IMAGE_BUCKET']


def validate_image(image_data_base64, job_id, default_format='jpeg'):
    """
    Validate and upload a base64-encoded image to S3.
    
    Args:
        image_data_base64 (str): Base64-encoded image data
        job_id (str): Unique job identifier
        default_format (str): Default image format (jpeg or png)
        
    Returns:
        tuple: (S3 key, image format)
        
    Raises:
        ValueError: If image data is invalid or format is unsupported
    """
    try:
        # Decode base64 to ensure it's valid
        image_bytes = base64.b64decode(image_data_base64)
        
        # Use a default format (jpeg) unless specified elsewhere
        image_format = default_format
        if image_format not in ['jpeg', 'png']:
            raise ValueError('Unsupported image format. Use JPEG or PNG')
        
        # Generate S3 key and content type
        image_key = f"uploads/{job_id}.{image_format}"
        content_type = f"image/{image_format}"
        
        # Upload to S3
        s3_client.put_object(
            Bucket=image_bucket,
            Key=image_key,
            Body=image_bytes,
            ContentType=content_type
        )
        return image_key, image_format
    except base64.binascii.Error:
        raise ValueError('Invalid base64-encoded image data')
    except Exception as e:
        raise ValueError(f'Error processing image: {str(e)}')


def submit_job_handler(event, context):
    """
    Lambda handler for job submission requests.
    
    Args:
        event (dict): API Gateway event
        context (object): Lambda context
        
    Returns:
        dict: API Gateway response with job ID and status
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        task_type = body.get('task_type', 'TEXT_VIDEO')  # Default to single-shot
        prompt = body.get('prompt')  # For TEXT_VIDEO or MULTI_SHOT_AUTOMATED
        duration = body.get('duration', 6)  # For MULTI_SHOT_AUTOMATED
        shots = body.get('shots')  # For MULTI_SHOT_MANUAL
        
        # Extract user information from the request context
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})
        claims = authorizer.get('claims', {})
        
        # Get user ID from Cognito claims
        user_id = claims.get('sub')
        user_email = claims.get('email')
        
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS',
                    'Access-Control-Allow-Credentials': 'true'
                },
                'body': json.dumps({'error': 'User authentication required'})
            }

        # Validate inputs based on task type
        if task_type == 'TEXT_VIDEO':
            if not prompt or len(prompt) > 512:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS',
                        'Access-Control-Allow-Credentials': 'true'
                    },
                    'body': json.dumps({'error': 'A text prompt (1-512 characters) is required for TEXT_VIDEO'})
                }
        elif task_type == 'MULTI_SHOT_AUTOMATED':
            if not prompt or len(prompt) > 4000:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS',
                        'Access-Control-Allow-Credentials': 'true'
                    },
                    'body': json.dumps({'error': 'A text prompt (1-4000 characters) is required for MULTI_SHOT_AUTOMATED'})
                }
            if not isinstance(duration, int) or duration < 12 or duration > 120 or duration % 6 != 0:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS',
                        'Access-Control-Allow-Credentials': 'true'
                    },
                    'body': json.dumps({'error': 'Duration must be a multiple of 6 between 12 and 120 seconds'})
                }
        elif task_type == 'MULTI_SHOT_MANUAL':
            if not shots or not isinstance(shots, list) or len(shots) < 2 or len(shots) > 20:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS',
                        'Access-Control-Allow-Credentials': 'true'
                    },
                    'body': json.dumps({'error': 'MULTI_SHOT_MANUAL requires 2-20 shots'})
                }
            for shot in shots:
                if not shot.get('text') or len(shot['text']) > 512:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                            'Access-Control-Allow-Methods': 'POST,OPTIONS',
                            'Access-Control-Allow-Credentials': 'true'
                        },
                        'body': json.dumps({'error': 'Each shot requires a text prompt (1-512 characters)'})
                    }
        else:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS',
                    'Access-Control-Allow-Credentials': 'true'
                },
                'body': json.dumps({'error': 'Invalid task_type. Use TEXT_VIDEO, MULTI_SHOT_AUTOMATED, or MULTI_SHOT_MANUAL'})
            }

        # Generate unique job ID and timestamp
        job_id = str(uuid.uuid4())
        timestamp = int(time.time())
        
        # Create base job item
        item = {
            'job_id': job_id,
            'status': 'SUBMITTED',
            'task_type': task_type,
            'created_at': timestamp,
            'ttl': timestamp + (7 * 24 * 60 * 60),  # 7-day TTL
            'user_id': user_id,  # Store user ID for filtering
            'user_email': user_email  # Store email for notifications
        }

        # Handle task-specific data
        if task_type == 'TEXT_VIDEO':
            item['prompt'] = prompt
            image_data_base64 = body.get('image')
            if image_data_base64:
                image_key, image_format = validate_image(image_data_base64, job_id)
                item['image_key'] = image_key
                item['image_format'] = image_format
        elif task_type == 'MULTI_SHOT_AUTOMATED':
            item['prompt'] = prompt
            item['duration'] = duration
        elif task_type == 'MULTI_SHOT_MANUAL':
            item['shots'] = []
            for idx, shot in enumerate(shots):
                shot_item = {'text': shot['text']}
                image_data_base64 = shot.get('image')
                if image_data_base64:
                    image_key, image_format = validate_image(image_data_base64, f"{job_id}_shot_{idx+1}")
                    shot_item['image_key'] = image_key
                    shot_item['image_format'] = image_format
                item['shots'].append(shot_item)

        # Store job in DynamoDB
        table.put_item(Item=item)

        # Return success response with CORS headers
        return {
            'statusCode': 202,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
                'Access-Control-Allow-Credentials': 'true'
            },
            'body': json.dumps({
                'job_id': job_id,
                'status': 'SUBMITTED',
                'message': 'Job submitted successfully'
            })
        }
    except NoCredentialsError:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
                'Access-Control-Allow-Credentials': 'true'
            },
            'body': json.dumps({'error': 'AWS credentials not found'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
                'Access-Control-Allow-Credentials': 'true'
            },
            'body': json.dumps({'error': str(e)})
        }
