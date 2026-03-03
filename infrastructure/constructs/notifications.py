"""
Notification constructs for the ReelCraft AI application.

This module defines the notification resources used by the application:
- SNS topic for completion notifications
- SNS subscription for user-specific email notifications
"""

from aws_cdk import (
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
)
from constructs import Construct


class NotificationsConstruct(Construct):
    """
    Construct containing notification resources for ReelCraft AI.
    """
    
    def __init__(self, scope: Construct, construct_id: str) -> None:
        """
        Initialize notification resources.
        
        Args:
            scope: CDK construct scope
            construct_id: Unique identifier for the construct
        """
        super().__init__(scope, construct_id)
        
        # Create SNS Topic for Notifications
        self.completion_topic = sns.Topic(
            self, "VideoCompletionTopic",
            display_name="Video Completion Notifications"
        )
        
        # We'll use SNS filter policy to filter messages by user_id
        # This allows us to send notifications only to the user who created the job
