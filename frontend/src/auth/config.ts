/**
 * AWS Amplify configuration for authentication
 * 
 * This file loads configuration values from environment variables
 * which should be set after CDK deployment.
 */

// Get environment variables with fallbacks for development
const getEnvVariable = (key: string, defaultValue: string = ''): string => {
  const value = import.meta.env[key];
  if (!value && import.meta.env.PROD) {
    console.warn(`Environment variable ${key} is not set!`);
  }
  return value || defaultValue;
};

// AWS Region
const region = getEnvVariable('VITE_AWS_REGION', 'us-east-1');

// Cognito configuration
const userPoolId = getEnvVariable('VITE_COGNITO_USER_POOL_ID');
const userPoolClientId = getEnvVariable('VITE_COGNITO_USER_POOL_CLIENT_ID');
const identityPoolId = getEnvVariable('VITE_COGNITO_IDENTITY_POOL_ID');

// API Gateway endpoint
const apiEndpoint = getEnvVariable('VITE_API_ENDPOINT');

// AWS Amplify configuration
export const awsConfig = {
  Auth: {
    Cognito: {
      region,
      userPoolId,
      userPoolClientId,
      identityPoolId,
    }
  }
};

// Get API endpoint
export const getApiEndpoint = (): string => {
  return apiEndpoint;
};

// Validate configuration
export const validateConfig = (): boolean => {
  const requiredVars = [
    'VITE_AWS_REGION',
    'VITE_COGNITO_USER_POOL_ID',
    'VITE_COGNITO_USER_POOL_CLIENT_ID',
    'VITE_COGNITO_IDENTITY_POOL_ID',
    'VITE_API_ENDPOINT'
  ];
  
  const missingVars = requiredVars.filter(
    varName => !import.meta.env[varName]
  );
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    return false;
  }
  
  return true;
};
