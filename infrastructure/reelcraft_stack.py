"""
AWS CDK stack for the ContentCraft AI serverless content generation system.

This module defines the complete infrastructure for the application, including:
- DynamoDB table for job tracking
- S3 buckets for storing videos and images
- Lambda functions for job submission, processing, and status checking
- API Gateway for RESTful endpoints
- IAM permissions for secure service access
- SNS topic for completion notifications
- Cognito User Pool for authentication

The stack creates a fully functional serverless architecture that leverages
Amazon Bedrock's Nova models for AI-powered content generation.
"""

from aws_cdk import (
    Stack,
    CfnOutput,
)
from constructs import Construct

from .constructs.storage import StorageConstruct
from .constructs.compute import ComputeConstruct
from .constructs.api import ApiGatewayConstruct
from .constructs.notifications import NotificationsConstruct
from .constructs.auth import AuthConstruct
from .constructs.email_subscription import EmailSubscriptionConstruct


class ContentCraftStack(Stack):
    """
    CDK Stack for the ContentCraft AI serverless content generation system.
    
    This stack creates all the necessary AWS resources for the application.
    """
    
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        """
        Initialize the stack with all required resources.
        
        Args:
            scope: CDK construct scope
            construct_id: Unique identifier for the stack
            **kwargs: Additional arguments passed to the parent Stack class
        """
        super().__init__(scope, construct_id, **kwargs)

        # Create Authentication Resources
        auth = AuthConstruct(self, "Auth")
        
        # Create Storage Resources
        storage = StorageConstruct(self, "Storage")
        
        # Create Notification Resources
        notifications = NotificationsConstruct(self, "Notifications")
        
        # Create Email Subscription Resources
        email_subscription = EmailSubscriptionConstruct(
            self, "EmailSubscription",
            completion_topic=notifications.completion_topic,
            job_tracking_table=storage.job_tracking_table
        )
        
        # Create Compute Resources
        compute = ComputeConstruct(
            self, "Compute",
            job_tracking_table=storage.job_tracking_table,
            reel_storage_bucket=storage.reel_storage_bucket,
            image_upload_bucket=storage.image_upload_bucket,
            completion_topic=notifications.completion_topic,
            region=self.region,
            account=self.account
        )
        
        # Create API Gateway with Cognito authorizer
        api_gateway = ApiGatewayConstruct(
            self, "ApiGateway",
            submit_job_function=compute.submit_job_function,
            check_job_status_function=compute.check_job_status_function,
            list_jobs_function=compute.list_jobs_function,
            subscribe_function=email_subscription.subscribe_function,
            director_function=compute.director_function,
            user_pool=auth.user_pool
        )
        
        # Output important resource information
        self._create_outputs(
            reel_storage_bucket=storage.reel_storage_bucket,
            image_upload_bucket=storage.image_upload_bucket,
            api=api_gateway.api,
            completion_topic=notifications.completion_topic,
            user_pool_id=auth.user_pool.user_pool_id,
            user_pool_client_id=auth.user_pool_client.user_pool_client_id,
            identity_pool_id=auth.identity_pool.ref
        )

    def _create_outputs(self, reel_storage_bucket, image_upload_bucket, api, 
                       completion_topic, user_pool_id, user_pool_client_id, identity_pool_id):
        """
        Create CloudFormation outputs for important resources.
        
        Args:
            reel_storage_bucket: S3 bucket for storing videos
            image_upload_bucket: S3 bucket for storing images
            api: API Gateway
            completion_topic: SNS topic for notifications
            user_pool_id: Cognito User Pool ID
            user_pool_client_id: Cognito User Pool Client ID
            identity_pool_id: Cognito Identity Pool ID
        """
        CfnOutput(self, "ReelStorageBucketName", value=reel_storage_bucket.bucket_name)
        CfnOutput(self, "ImageUploadBucketName", value=image_upload_bucket.bucket_name)
        CfnOutput(self, "ApiGatewayEndpoint", value=api.url)
        CfnOutput(self, "VideoCompletionTopicArn", value=completion_topic.topic_arn)
        CfnOutput(self, "UserPoolId", value=user_pool_id)
        CfnOutput(self, "UserPoolClientId", value=user_pool_client_id)
        CfnOutput(self, "IdentityPoolId", value=identity_pool_id)
