"""
API Gateway constructs for the ReelCraft AI application.

This module defines the API Gateway resources used by the application:
- REST API with Lambda integrations
- Cognito authorizer for secure access
- Endpoints for job submission, status checking, and listing
"""

from aws_cdk import (
    aws_apigateway as apigateway,
    aws_lambda as lambda_,
    aws_cognito as cognito,
)
from constructs import Construct


class ApiGatewayConstruct(Construct):
    """
    Construct containing API Gateway resources for ReelCraft AI.
    """
    
    def __init__(
        self, 
        scope: Construct, 
        construct_id: str,
        submit_job_function: lambda_.Function,
        check_job_status_function: lambda_.Function,
        list_jobs_function: lambda_.Function,
        subscribe_function: lambda_.Function,
        director_function: lambda_.Function,
        user_pool: cognito.UserPool
    ) -> None:
        """
        Initialize API Gateway resources.
        
        Args:
            scope: CDK construct scope
            construct_id: Unique identifier for the construct
            submit_job_function: Lambda function for job submission
            check_job_status_function: Lambda function for checking job status
            list_jobs_function: Lambda function for listing user jobs
            subscribe_function: Lambda function for email subscription
            director_function: Lambda function for the Nova director agent
            user_pool: Cognito User Pool for authentication
        """
        super().__init__(scope, construct_id)
        
        # Create API Gateway
        self.api = apigateway.RestApi(
            self, "ReelCraftApi",
            rest_api_name="ReelCraft API",
            description="API for ReelCraft AI video generation",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=[
                    "Content-Type",
                    "Authorization",
                    "X-Amz-Date",
                    "X-Api-Key",
                    "X-Amz-Security-Token",
                    "X-Requested-With"
                ]
            )
        )
        
        # Create Cognito authorizer
        auth = apigateway.CognitoUserPoolsAuthorizer(
            self, "ReelCraftAuthorizer",
            cognito_user_pools=[user_pool]
        )
        
        # Create API resources and methods
        self._create_api_endpoints(
            submit_job_function,
            check_job_status_function,
            list_jobs_function,
            subscribe_function,
            director_function,
            auth
        )
    
    def _create_api_endpoints(
        self,
        submit_job_function: lambda_.Function,
        check_job_status_function: lambda_.Function,
        list_jobs_function: lambda_.Function,
        subscribe_function: lambda_.Function,
        director_function: lambda_.Function,
        auth: apigateway.CognitoUserPoolsAuthorizer
    ) -> None:
        """
        Create API endpoints with Lambda integrations.
        
        Args:
            submit_job_function: Lambda function for job submission
            check_job_status_function: Lambda function for checking job status
            list_jobs_function: Lambda function for listing user jobs
            subscribe_function: Lambda function for email subscription
            auth: Cognito authorizer for API Gateway
        """
        # Common integration options
        integration_options = {
            "proxy": True,
            "integration_responses": [
                {
                    "statusCode": "200",
                    "responseParameters": {
                        "method.response.header.Access-Control-Allow-Origin": "'*'"
                    }
                }
            ]
        }
        
        # Common method options with authorization
        method_options = {
            "authorization_type": apigateway.AuthorizationType.COGNITO,
            "authorizer": auth,
            "method_responses": [
                {
                    "statusCode": "200",
                    "responseParameters": {
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                }
            ]
        }
        
        # Create /reel_generation endpoint for job submission
        reel_generation = self.api.root.add_resource("reel_generation")
        reel_generation.add_method(
            "POST",
            apigateway.LambdaIntegration(submit_job_function, **integration_options),
            **method_options
        )
        
        # Create /job_status/{jobId} endpoint for checking job status
        job_status = self.api.root.add_resource("job_status")
        job_status_with_id = job_status.add_resource("{jobId}")
        job_status_with_id.add_method(
            "GET",
            apigateway.LambdaIntegration(check_job_status_function, **integration_options),
            **method_options
        )
        
        # Create /jobs endpoint for listing user jobs
        jobs = self.api.root.add_resource("jobs")
        jobs.add_method(
            "GET",
            apigateway.LambdaIntegration(list_jobs_function, **integration_options),
            **method_options
        )
        
        # Create /subscribe endpoint for email subscriptions
        subscribe = self.api.root.add_resource("subscribe")
        subscribe.add_method(
            "POST",
            apigateway.LambdaIntegration(subscribe_function, **integration_options),
            **method_options
        )

        # Create /plan endpoint for the Nova Director Agent
        plan = self.api.root.add_resource("plan")
        plan.add_method(
            "POST",
            apigateway.LambdaIntegration(director_function, **integration_options),
            **method_options
        )
