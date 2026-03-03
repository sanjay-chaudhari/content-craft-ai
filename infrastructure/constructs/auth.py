"""
Authentication construct for the ReelCraft AI application.

This module defines the Cognito User Pool and related resources for user authentication.
"""

from aws_cdk import (
    aws_cognito as cognito,
    aws_iam as iam,
    CfnOutput,
    Duration,
    RemovalPolicy,
)
from constructs import Construct


class AuthConstruct(Construct):
    """
    Construct for authentication resources using Amazon Cognito.
    
    This construct creates a Cognito User Pool, App Client, and Identity Pool
    for user authentication and authorization in the ReelCraft application.
    """
    
    def __init__(self, scope: Construct, id: str) -> None:
        """
        Initialize the authentication resources.
        
        Args:
            scope: CDK construct scope
            id: Unique identifier for the construct
        """
        super().__init__(scope, id)
        
        # Create Cognito User Pool
        self.user_pool = cognito.UserPool(
            self, "ReelCraftUserPool",
            user_pool_name="reelcraft-user-pool",
            self_sign_up_enabled=False,
            sign_in_aliases=cognito.SignInAliases(
                email=True,
                username=True
            ),
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(
                    required=True,
                    mutable=True
                ),
                fullname=cognito.StandardAttribute(
                    required=False,
                    mutable=True
                )
            ),
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=True,
                temp_password_validity=Duration.days(7)
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=RemovalPolicy.DESTROY  # For development; use RETAIN for production
        )
        
        # Create User Pool Client
        self.user_pool_client = self.user_pool.add_client(
            "ReelCraftWebClient",
            user_pool_client_name="reelcraft-web-client",
            generate_secret=False,
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True
            ),
            o_auth=cognito.OAuthSettings(
                flows=cognito.OAuthFlows(
                    implicit_code_grant=True,
                    authorization_code_grant=True
                ),
                scopes=[cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
                callback_urls=[
                    "http://localhost:3000/",  # Local development
                    "https://frontend.example.com/",  # Replace with your production URL
                ],
                logout_urls=[
                    "http://localhost:3000/",  # Local development
                    "https://frontend.example.com/",  # Replace with your production URL
                ]
            )
        )
        
        # Create Identity Pool for authenticated and unauthenticated roles
        self.identity_pool = cognito.CfnIdentityPool(
            self, "ReelCraftIdentityPool",
            identity_pool_name="reelcraft_identity_pool",
            allow_unauthenticated_identities=False,
            cognito_identity_providers=[
                cognito.CfnIdentityPool.CognitoIdentityProviderProperty(
                    client_id=self.user_pool_client.user_pool_client_id,
                    provider_name=self.user_pool.user_pool_provider_name
                )
            ]
        )
        
        # Create IAM roles for authenticated users
        self.authenticated_role = iam.Role(
            self, "ReelCraftAuthenticatedRole",
            assumed_by=iam.FederatedPrincipal(
                "cognito-identity.amazonaws.com",
                conditions={
                    "StringEquals": {
                        "cognito-identity.amazonaws.com:aud": self.identity_pool.ref
                    },
                    "ForAnyValue:StringLike": {
                        "cognito-identity.amazonaws.com:amr": "authenticated"
                    }
                },
                assume_role_action="sts:AssumeRoleWithWebIdentity"
            )
        )
        
        # Attach role to identity pool
        cognito.CfnIdentityPoolRoleAttachment(
            self, "IdentityPoolRoleAttachment",
            identity_pool_id=self.identity_pool.ref,
            roles={
                "authenticated": self.authenticated_role.role_arn
            }
        )
        
        # Create outputs
        CfnOutput(self, "UserPoolId", value=self.user_pool.user_pool_id)
        CfnOutput(self, "UserPoolClientId", value=self.user_pool_client.user_pool_client_id)
        CfnOutput(self, "IdentityPoolId", value=self.identity_pool.ref)
