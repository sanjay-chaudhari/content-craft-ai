# ContentCraft AI CloudFormation Deployment

This directory contains the CloudFormation deployment resources for the ContentCraft AI application, providing an alternative to the CDK deployment method.

## Files

- `ContentCraftStack-Complete.yaml`: Complete CloudFormation template that defines all resources
- `deploy-contentcraft.sh`: Deployment script that packages Lambda code and deploys the stack
- `README.md`: Detailed documentation on the CloudFormation deployment process

## Quick Start

To deploy using CloudFormation:

```bash
# Navigate to the cloudformation directory
cd infrastructure/cloudformation

# Make the deployment script executable
chmod +x deploy-reelcraft.sh

# Run the deployment script
./deploy-reelcraft.sh
```

For detailed instructions, see [README.md](./README.md).

