"""
Email subscription construct for the ReelCraft AI application.

This module defines a Lambda function that subscribes users to the SNS topic
with a filter policy based on their user ID, ensuring they only receive
notifications for their own jobs.
"""

from aws_cdk import (
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_sns as sns,
    aws_dynamodb as dynamodb,
    Duration,
)
from constructs import Construct


class EmailSubscriptionConstruct(Construct):
    """
    Construct for managing user email subscriptions to SNS topics.
    """
    
    def __init__(
        self, 
        scope: Construct, 
        construct_id: str,
        completion_topic: sns.Topic,
        job_tracking_table: dynamodb.Table
    ) -> None:
        """
        Initialize email subscription resources.
        
        Args:
            scope: CDK construct scope
            construct_id: Unique identifier for the construct
            completion_topic: SNS topic for completion notifications
            job_tracking_table: DynamoDB table for job tracking
        """
        super().__init__(scope, construct_id)
        
        # Create Lambda function for subscribing users to SNS
        self.subscribe_function = lambda_.Function(
            self, "SubscribeEmailFunction",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="subscribe.subscribe_handler",
            code=lambda_.Code.from_asset("lambda/subscribe"),
            timeout=Duration.seconds(30),
            memory_size=128,
            environment={
                "SNS_TOPIC_ARN": completion_topic.topic_arn,
                "TABLE_NAME": job_tracking_table.table_name
            }
        )
        
        # Grant permissions to subscribe users to SNS
        # Use add_to_role_policy instead of grant method
        self.subscribe_function.add_to_role_policy(
            iam.PolicyStatement(
                actions=[
                    "sns:Subscribe",
                    "sns:Unsubscribe",
                    "sns:ListSubscriptionsByTopic"
                ],
                resources=[completion_topic.topic_arn]
            )
        )
        
        # Allow setting filter policies on subscriptions
        self.subscribe_function.add_to_role_policy(
            iam.PolicyStatement(
                actions=["sns:SetSubscriptionAttributes"],
                resources=[completion_topic.topic_arn]
            )
        )
        
        # Grant read access to DynamoDB
        job_tracking_table.grant_read_data(self.subscribe_function)
