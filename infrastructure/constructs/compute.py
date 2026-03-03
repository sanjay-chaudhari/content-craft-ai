"""
Compute constructs for the ReelCraft AI application.

This module defines the compute resources used by the application:
- Lambda functions for job submission, processing, and status checking
- IAM roles and policies for secure service access
"""

from aws_cdk import (
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_sns as sns,
    Duration,
)
from constructs import Construct


class ComputeConstruct(Construct):
    """
    Construct containing compute resources for ReelCraft AI.
    """
    
    def __init__(
        self, 
        scope: Construct, 
        construct_id: str,
        job_tracking_table: dynamodb.Table,
        reel_storage_bucket: s3.Bucket,
        image_upload_bucket: s3.Bucket,
        completion_topic: sns.Topic,
        region: str,
        account: str
    ) -> None:
        """
        Initialize compute resources.
        
        Args:
            scope: CDK construct scope
            construct_id: Unique identifier for the construct
            job_tracking_table: DynamoDB table for job tracking
            reel_storage_bucket: S3 bucket for storing videos
            image_upload_bucket: S3 bucket for storing images
            completion_topic: SNS topic for completion notifications
            region: AWS region
            account: AWS account ID
        """
        super().__init__(scope, construct_id)
        
        # Create Lambda functions
        self.submit_job_function = self._create_submit_job_function(
            job_tracking_table, 
            image_upload_bucket
        )
        
        self.process_job_function = self._create_process_job_function(
            job_tracking_table, 
            reel_storage_bucket, 
            image_upload_bucket,
            completion_topic,
            region,
            account
        )
        
        self.check_job_status_function = self._create_check_job_status_function(
            job_tracking_table
        )
        
        self.list_jobs_function = self._create_list_jobs_function(
            job_tracking_table
        )

        self.director_function = self._create_director_function(region, account)

        # Grant explicit DynamoDB Stream permissions to the process function
        job_tracking_table.grant_stream_read(self.process_job_function)
        
        # Add explicit permissions for DynamoDB Streams
        self.process_job_function.add_to_role_policy(
            iam.PolicyStatement(
                actions=[
                    "dynamodb:GetRecords",
                    "dynamodb:GetShardIterator",
                    "dynamodb:DescribeStream",
                    "dynamodb:ListStreams"
                ],
                resources=[
                    job_tracking_table.table_stream_arn,
                    f"{job_tracking_table.table_arn}/stream/*"
                ]
            )
        )
        
        # Set up DynamoDB stream trigger for process function
        self.process_job_function.add_event_source_mapping(
            "DynamoDBStreamMapping",
            event_source_arn=job_tracking_table.table_stream_arn,
            starting_position=lambda_.StartingPosition.LATEST,
            batch_size=1,
            retry_attempts=3,
            filters=[
                {
                    "pattern": '{"eventName": ["INSERT"]}'
                }
            ]
        )
    
    def _create_submit_job_function(
        self, 
        job_tracking_table: dynamodb.Table,
        image_upload_bucket: s3.Bucket
    ) -> lambda_.Function:
        """
        Create the Lambda function for job submission.
        
        Args:
            job_tracking_table: DynamoDB table for job tracking
            image_upload_bucket: S3 bucket for storing images
            
        Returns:
            lambda_.Function: The created Lambda function
        """
        function = lambda_.Function(
            self, "SubmitJobFunction",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="submit.submit_job_handler",
            code=lambda_.Code.from_asset("lambda/submit"),
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "TABLE_NAME": job_tracking_table.table_name,
                "IMAGE_BUCKET": image_upload_bucket.bucket_name
            }
        )
        
        # Grant permissions
        job_tracking_table.grant_write_data(function)
        image_upload_bucket.grant_write(function)
        
        return function
    
    def _create_process_job_function(
        self, 
        job_tracking_table: dynamodb.Table,
        reel_storage_bucket: s3.Bucket,
        image_upload_bucket: s3.Bucket,
        completion_topic: sns.Topic,
        region: str,
        account: str
    ) -> lambda_.Function:
        """
        Create the Lambda function for job processing.
        
        Args:
            job_tracking_table: DynamoDB table for job tracking
            reel_storage_bucket: S3 bucket for storing videos
            image_upload_bucket: S3 bucket for storing images
            completion_topic: SNS topic for completion notifications
            region: AWS region
            account: AWS account ID
            
        Returns:
            lambda_.Function: The created Lambda function
        """
        function = lambda_.Function(
            self, "ProcessJobFunction",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="process.process_job_handler",
            code=lambda_.Code.from_asset("lambda/process"),
            timeout=Duration.minutes(15),
            memory_size=512,
            environment={
                "TABLE_NAME": job_tracking_table.table_name,
                "BUCKET": reel_storage_bucket.bucket_name,
                "IMAGE_BUCKET": image_upload_bucket.bucket_name,
                "SNS_TOPIC_ARN": completion_topic.topic_arn,
                "MODEL_ID": "amazon.nova-reel-v1:1",
                "SES_SENDER_EMAIL": "sanjaycz@amazon.com"
            }
        )
        
        # Grant permissions
        job_tracking_table.grant_read_write_data(function)
        reel_storage_bucket.grant_read_write(function)
        image_upload_bucket.grant_read(function)
        completion_topic.grant_publish(function)
        
        # Grant Bedrock permissions with broader resource access
        function.add_to_role_policy(
            iam.PolicyStatement(
                actions=[
                    "bedrock:StartAsyncInvoke",
                    "bedrock:GetAsyncInvoke",
                    "bedrock:ListAsyncInvokes",
                    "bedrock:InvokeModel"
                ],
                resources=[
                    # Include both custom model and foundation model ARN formats
                    f"arn:aws:bedrock:{region}:{account}:model/amazon.nova-reel-v1:1",
                    f"arn:aws:bedrock:{region}::foundation-model/amazon.nova-reel-v1:1",
                    f"arn:aws:bedrock:{region}:{account}:async-invoke/*"
                ]
            )
        )

        # Grant SES send email permission
        function.add_to_role_policy(
            iam.PolicyStatement(
                actions=["ses:SendEmail", "ses:SendRawEmail"],
                resources=["*"]
            )
        )
                
        return function
    
    def _create_check_job_status_function(
        self, 
        job_tracking_table: dynamodb.Table
    ) -> lambda_.Function:
        """
        Create the Lambda function for checking job status.
        
        Args:
            job_tracking_table: DynamoDB table for job tracking
            
        Returns:
            lambda_.Function: The created Lambda function
        """
        function = lambda_.Function(
            self, "CheckJobStatusFunction",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="status.check_job_status_handler",
            code=lambda_.Code.from_asset("lambda/status"),
            timeout=Duration.seconds(10),
            memory_size=128,
            environment={
                "TABLE_NAME": job_tracking_table.table_name
            }
        )
        
        # Grant permissions
        job_tracking_table.grant_read_data(function)
        
        return function
    
    def _create_list_jobs_function(
        self, 
        job_tracking_table: dynamodb.Table
    ) -> lambda_.Function:
        function = lambda_.Function(
            self, "ListJobsFunction",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="list_jobs.list_jobs_handler",
            code=lambda_.Code.from_asset("lambda/list_jobs"),
            timeout=Duration.seconds(10),
            memory_size=128,
            environment={
                "TABLE_NAME": job_tracking_table.table_name
            }
        )
        job_tracking_table.grant_read_data(function)
        return function

    def _create_director_function(self, region: str, account: str) -> lambda_.Function:
        """
        Create the Lambda function for the Nova Director Agent.
        Uses Nova to reason about a creative goal and produce a structured shot plan.
        """
        function = lambda_.Function(
            self, "DirectorAgentFunction",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="director.director_handler",
            code=lambda_.Code.from_asset("lambda/director"),
            timeout=Duration.seconds(60),
            memory_size=256,
            environment={
                "DIRECTOR_MODEL_ID": "amazon.nova-pro-v1:0"
            }
        )

        function.add_to_role_policy(
            iam.PolicyStatement(
                actions=["bedrock:InvokeModel", "bedrock:Converse"],
                resources=[
                    f"arn:aws:bedrock:{region}::foundation-model/amazon.nova-pro-v1:0",
                    f"arn:aws:bedrock:{region}::foundation-model/amazon.nova-lite-v1:0",
                ]
            )
        )

        return function
