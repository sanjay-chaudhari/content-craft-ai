# ContentCraft AI — Frontend

React + Vite + TypeScript frontend for ContentCraft AI, deployed on AWS Amplify.

## Live App

**https://{branch}.{amplify-app-id}.amplifyapp.com**

## AWS Resources

| Resource | Value |
|----------|-------|
| Amplify App ID | `{amplify-app-id}` |
| Amplify URL | `https://main.{amplify-app-id}.amplifyapp.com` |
| API Endpoint | `https://{api-id}.execute-api.{region}.amazonaws.com/prod` |
| Cognito User Pool ID | `{region}_{pool-id}` |
| Cognito Client ID | `{client-id}` |
| Identity Pool ID | `{region}:{identity-pool-id}` |

## Features

- **✨ AI Director (Nova Agent)** — Describe your video idea in plain language; Nova Pro reasons about it and generates a full multi-shot production plan
- **Single Clip** — 6-second video from a text prompt with optional reference image
- **Automated Multi-Clip** — 12–120 second video from a single comprehensive prompt
- **Manual Multi-Clip** — Full control over each shot with individual prompts and images
- **Job History** — View all submitted jobs with pagination
- **Email Notifications** — Subscribe to receive HTML email alerts on job completion
- **Cognito Auth** — Sign up, sign in, email verification, forgot password

## Local Development

### Prerequisites
- Node.js 18+
- Deployed CDK backend (see root README)

### Setup

```bash
cd frontend
npm install
```

Create `.env` from the example template:
```bash
cp .env.example .env
```

Fill in values from CDK outputs:
```
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=<from cdk output>
VITE_COGNITO_USER_POOL_CLIENT_ID=<from cdk output>
VITE_COGNITO_IDENTITY_POOL_ID=<from cdk output>
VITE_API_ENDPOINT=https://{api-id}.execute-api.{region}.amazonaws.com/prod
```

> **Note:** `.env` is gitignored and must never be committed. Use `.env.example` as a reference template.

```bash
npm run dev   # http://localhost:5173
```

## Amplify Deployment

### Manual deploy (from built artifact)

```bash
# Build
cd frontend && npm run build

# Zip dist
cd dist && zip -r ../../build.zip .

# Create deployment and get upload URL
aws amplify create-deployment \
  --app-id {amplify-app-id} \
  --branch-name main \
  --region {region}

# Upload zip to the returned zipUploadUrl
curl -T ../../build.zip "<zipUploadUrl>"

# Start deployment
aws amplify start-deployment \
  --app-id {amplify-app-id} \
  --branch-name main \
  --job-id 1 \
  --region {region}
```

### Environment variables (set on Amplify branch)

```bash
aws amplify update-branch \
  --app-id {amplify-app-id} \
  --branch-name main \
  --environment-variables \
    VITE_AWS_REGION={region} \
    VITE_COGNITO_USER_POOL_ID={user-pool-id} \
    VITE_COGNITO_USER_POOL_CLIENT_ID={client-id} \
    VITE_COGNITO_IDENTITY_POOL_ID={identity-pool-id} \
    VITE_API_ENDPOINT=https://{api-id}.execute-api.{region}.amazonaws.com/prod \
  --region {region}
```

## Project Structure

```
src/
├── auth/
│   ├── components/        # SignIn, SignUp, VerifyAccount, ForgotPassword
│   ├── AuthContext.tsx    # Amplify v6 auth context
│   └── config.ts          # Amplify configuration from env vars
├── components/
│   ├── DirectorAgent.tsx  # ✨ Nova AI Director Agent
│   ├── VideoForm.tsx      # Mode selector + form container
│   ├── SingleClipForm.tsx
│   ├── AutomatedMultiClipForm.tsx
│   ├── ManualMultiClipForm.tsx  # Accepts pre-filled shots from Director
│   ├── StatusPanel.tsx    # Polls job status, renders video player
│   ├── JobsList.tsx       # Paginated job history table
│   ├── EmailSubscription.tsx
│   ├── FeatureSelection.tsx
│   └── Header.tsx
├── utils/                 # Translation helpers
├── i18n/                  # i18next config + locale files
├── App.tsx
└── main.tsx
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_AWS_REGION` | AWS region |
| `VITE_COGNITO_USER_POOL_ID` | Cognito User Pool ID |
| `VITE_COGNITO_USER_POOL_CLIENT_ID` | Cognito App Client ID |
| `VITE_COGNITO_IDENTITY_POOL_ID` | Cognito Identity Pool ID |
| `VITE_API_ENDPOINT` | API Gateway base URL (no trailing slash) |
