#!/usr/bin/env python3
"""
Main CDK application entry point for ContentCraft AI.

This script initializes the AWS CDK application and creates the main infrastructure stack.
"""
import os
import aws_cdk as cdk
from infrastructure.reelcraft_stack import ContentCraftStack


def main():
    """Initialize and deploy the CDK application."""
    app = cdk.App()
    
    # Create the main infrastructure stack
    ContentCraftStack(
        app, 
        "ContentCraftStack"
    )
    
    # Synthesize CloudFormation template
    app.synth()


if __name__ == "__main__":
    main()
