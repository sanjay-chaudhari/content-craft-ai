"""
Lambda function for subscribing users to SNS notifications.

This module handles user email subscription to the SNS topic with a filter policy
that ensures users only receive notifications for their own jobs.
"""

import json
import os
import boto3
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
sns_client = boto3.client('sns')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])


def subscribe_handler(event, context) -> Dict[str, Any]:
    """
    Lambda handler for subscribing users to SNS notifications.
    
    Args:
        event (dict): API Gateway event
        context (object): Lambda context
        
    Returns:
        dict: API Gateway response with subscription status
    """
    try:
        # Extract user information from the request context
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})
        claims = authorizer.get('claims', {})
        
        # Get user ID and email from Cognito claims
        user_id = claims.get('sub')
        user_email = claims.get('email')
        
        if not user_id or not user_email:
            return {
                'statusCode': 401,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS',
                    'Access-Control-Allow-Credentials': 'true'
                },
                'body': json.dumps({'error': 'User authentication required with valid email'})
            }
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', 'subscribe')  # Default to subscribe
        
        topic_arn = os.environ['SNS_TOPIC_ARN']
        
        if action == 'subscribe':
            # Check if subscription already exists
            subscriptions = sns_client.list_subscriptions_by_topic(
                TopicArn=topic_arn
            )
            
            existing_subscription = None
            for subscription in subscriptions.get('Subscriptions', []):
                if subscription.get('Protocol') == 'email' and subscription.get('Endpoint') == user_email:
                    existing_subscription = subscription.get('SubscriptionArn')
                    break
            
            if existing_subscription and existing_subscription != 'PendingConfirmation':
                # Update filter policy on existing subscription
                sns_client.set_subscription_attributes(
                    SubscriptionArn=existing_subscription,
                    AttributeName='FilterPolicy',
                    AttributeValue=json.dumps({
                        'user_id': [user_id]
                    })
                )
                logger.info(f"Updated filter policy for existing subscription: {existing_subscription}")
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS',
                        'Access-Control-Allow-Credentials': 'true'
                    },
                    'body': json.dumps({
                        'message': 'Subscription updated with user filter',
                        'email': user_email
                    })
                }
            else:
                # Create new subscription with filter policy
                response = sns_client.subscribe(
                    TopicArn=topic_arn,
                    Protocol='email',
                    Endpoint=user_email,
                    Attributes={
                        'FilterPolicy': json.dumps({
                            'user_id': [user_id]
                        })
                    },
                    ReturnSubscriptionArn=True
                )
                
                subscription_arn = response.get('SubscriptionArn')
                logger.info(f"Created new subscription: {subscription_arn}")
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS',
                        'Access-Control-Allow-Credentials': 'true'
                    },
                    'body': json.dumps({
                        'message': 'Subscription created. Please confirm via email.',
                        'email': user_email
                    })
                }
        elif action == 'unsubscribe':
            # Find and remove subscription
            subscriptions = sns_client.list_subscriptions_by_topic(
                TopicArn=topic_arn
            )
            
            for subscription in subscriptions.get('Subscriptions', []):
                if subscription.get('Protocol') == 'email' and subscription.get('Endpoint') == user_email:
                    subscription_arn = subscription.get('SubscriptionArn')
                    if subscription_arn != 'PendingConfirmation':
                        sns_client.unsubscribe(
                            SubscriptionArn=subscription_arn
                        )
                        logger.info(f"Unsubscribed: {subscription_arn}")
            
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS',
                    'Access-Control-Allow-Credentials': 'true'
                },
                'body': json.dumps({
                    'message': 'Unsubscribed successfully',
                    'email': user_email
                })
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
                'body': json.dumps({'error': 'Invalid action. Use "subscribe" or "unsubscribe"'})
            }
    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
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
