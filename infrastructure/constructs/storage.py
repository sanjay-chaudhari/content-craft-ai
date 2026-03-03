"""
Storage constructs for the ReelCraft AI application.

This module defines the storage resources used by the application:
- DynamoDB table for job tracking
- S3 buckets for storing videos and images
"""

from aws_cdk import (
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    RemovalPolicy,
)
from constructs import Construct


class StorageConstruct(Construct):
    """
    Construct containing all storage resources for ReelCraft AI.
    """
    
    def __init__(self, scope: Construct, construct_id: str) -> None:
        """
        Initialize storage resources.
        
        Args:
            scope: CDK construct scope
            construct_id: Unique identifier for the construct
        """
        super().__init__(scope, construct_id)
        
        # Create DynamoDB Table for Job Tracking
        self.job_tracking_table = self._create_dynamodb_table()
        
        # Create S3 Buckets
        self.reel_storage_bucket, self.image_upload_bucket = self._create_s3_buckets()
    
    def _create_dynamodb_table(self) -> dynamodb.Table:
        """
        Create the DynamoDB table for job tracking.
        
        Returns:
            dynamodb.Table: The created DynamoDB table
        """
        table = dynamodb.Table(
            self, "JobTrackingTable",
            partition_key=dynamodb.Attribute(
                name="job_id",
                type=dynamodb.AttributeType.STRING
            ),
            time_to_live_attribute="ttl",
            removal_policy=RemovalPolicy.DESTROY,
            stream=dynamodb.StreamViewType.NEW_IMAGE
        )
        
        # Add a GSI for user-specific queries
        table.add_global_secondary_index(
            index_name="UserIdIndex",
            partition_key=dynamodb.Attribute(
                name="user_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.NUMBER
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )
        
        return table
    
    def _create_s3_buckets(self) -> tuple:
        """
        Create S3 buckets for storing videos and images.
        
        Returns:
            tuple: (reel_storage_bucket, image_upload_bucket)
        """
        # Bucket for storing generated videos
        reel_storage_bucket = s3.Bucket(
            self, "ReelStorageBucket",
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )
        
        # Bucket for storing uploaded images
        image_upload_bucket = s3.Bucket(
            self, "ImageUploadBucket",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )
        
        return reel_storage_bucket, image_upload_bucket
