"""
Lambda function for processing video generation jobs using Amazon Bedrock.

This module handles the core video generation process, including:
- Processing jobs from DynamoDB streams
- Configuring and calling Amazon Bedrock's Nova model
- Monitoring async job status
- Storing generated videos in S3
- Creating pre-signed URLs for video access
- Updating job status in DynamoDB
- Sending user-specific SNS notifications on completion

The function supports three task types:
1. TEXT_VIDEO: Single 6-second video from text prompt with optional image
2. MULTI_SHOT_AUTOMATED: Longer video (12-120s) from a single comprehensive prompt
3. MULTI_SHOT_MANUAL: Multiple shots with individual prompts and optional images
"""

import json
import os
import time
import random
import boto3
import logging
import base64
import decimal
from typing import Dict, List, Any, Optional

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
bedrock_runtime = boto3.client("bedrock-runtime")
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
sns_client = boto3.client('sns')
table = dynamodb.Table(os.environ['TABLE_NAME'])


def update_job_status(job_id: str, status: str, error_message: Optional[str] = None) -> None:
    """
    Update the status of a job in DynamoDB.
    
    Args:
        job_id (str): Unique job identifier
        status (str): New status (PROCESSING, COMPLETED, FAILED)
        error_message (str, optional): Error message if status is FAILED
    """
    update_expression = 'SET #status = :status'
    expression_names = {'#status': 'status'}
    expression_values = {':status': status}
    
    if error_message:
        update_expression += ', #errMsg = :errMsg'
        expression_names['#errMsg'] = 'errorMessage'
        expression_values[':errMsg'] = error_message
    
    table.update_item(
        Key={'job_id': job_id},
        UpdateExpression=update_expression,
        ExpressionAttributeNames=expression_names,
        ExpressionAttributeValues=expression_values
    )
    logger.info(f"Updated job {job_id} status to {status}")


def prepare_model_input(job: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare the input for the Bedrock model based on job parameters.
    
    Args:
        job (dict): Job data from DynamoDB
        
    Returns:
        dict: Formatted model input for Bedrock
        
    Raises:
        ValueError: If required parameters are missing
    """
    task_type = job.get('task_type', 'TEXT_VIDEO')
    
    # Base configuration for all task types
    model_input = {
        "taskType": task_type,
        "videoGenerationConfig": {
            "fps": 24,
            "dimension": "1280x720",
            "seed": random.randint(0, 2147483646)
        }
    }
    
    # Task-specific configuration
    if task_type == 'TEXT_VIDEO':
        if 'prompt' not in job:
            raise ValueError("A text prompt is required for TEXT_VIDEO")
            
        text_to_video_params = {"text": job['prompt']}
        
        # Handle optional image
        if 'image_key' in job:
            image_key = job['image_key']
            logger.info(f"Downloading image {image_key}")
            image_obj = s3_client.get_object(Bucket=os.environ['IMAGE_BUCKET'], Key=image_key)
            image_data = image_obj['Body'].read()
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            image_format = job.get('image_format', 'jpeg')
            text_to_video_params["images"] = [
                {
                    "format": image_format,
                    "source": {"bytes": image_base64}
                }
            ]
            logger.info(f"Using image (format: {image_format}) with text prompt")
        else:
            logger.info("Using text-only prompt")
            
        model_input["textToVideoParams"] = text_to_video_params
        model_input["videoGenerationConfig"]["durationSeconds"] = 6
        
    elif task_type == 'MULTI_SHOT_AUTOMATED':
        if 'prompt' not in job:
            raise ValueError("A text prompt is required for MULTI_SHOT_AUTOMATED")
            
        model_input["multiShotAutomatedParams"] = {"text": job['prompt']}
        
        # Convert duration to int if needed
        duration = job.get('duration', 12)
        if isinstance(duration, (decimal.Decimal, float)):
            duration = int(duration)
            
        model_input["videoGenerationConfig"]["durationSeconds"] = duration
        logger.info(f"Processing MULTI_SHOT_AUTOMATED with duration {duration}s")
        
    elif task_type == 'MULTI_SHOT_MANUAL':
        if 'shots' not in job:
            raise ValueError("Shots are required for MULTI_SHOT_MANUAL")
            
        shots = []
        for shot in job['shots']:
            shot_params = {"text": shot['text']}
            
            # Handle optional image for this shot
            if 'image_key' in shot:
                image_key = shot['image_key']
                logger.info(f"Downloading image {image_key}")
                image_obj = s3_client.get_object(Bucket=os.environ['IMAGE_BUCKET'], Key=image_key)
                image_data = image_obj['Body'].read()
                image_base64 = base64.b64encode(image_data).decode('utf-8')
                image_format = shot.get('image_format', 'jpeg')
                shot_params["image"] = {
                    "format": image_format,
                    "source": {"bytes": image_base64}
                }
                
            shots.append(shot_params)
            
        model_input["multiShotManualParams"] = {"shots": shots}
        logger.info(f"Processing MULTI_SHOT_MANUAL with {len(shots)} shots")
    else:
        raise ValueError(f"Invalid task_type: {task_type}")
        
    return model_input


def generate_presigned_urls(job_id: str, s3_prefix: str) -> Dict[str, Any]:
    """
    Generate pre-signed URLs for the generated videos.
    
    Args:
        job_id (str): Unique job identifier
        s3_prefix (str): S3 prefix for the job outputs
        
    Returns:
        dict: Dictionary with full video URL and shot URLs
    """
    bucket_name = os.environ['BUCKET']
    full_video_key = f"{job_id}/{s3_prefix}/output.mp4"
    status_key = f"{job_id}/{s3_prefix}/video-generation-status.json"
    
    # Read video-generation-status.json
    status_obj = s3_client.get_object(Bucket=bucket_name, Key=status_key)
    status_data = json.loads(status_obj['Body'].read().decode('utf-8'))
    logger.info(f"video-generation-status.json content: {json.dumps(status_data)}")
    
    # Generate pre-signed URL for full video
    full_video_url = s3_client.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': bucket_name,
            'Key': full_video_key,
            'ResponseContentDisposition': 'inline; filename="output.mp4"',
            'ResponseContentType': 'video/mp4'
        },
        ExpiresIn=86400  # 24 hours
    )
    
    # Generate pre-signed URLs for individual shots
    shot_urls = []
    for idx, shot in enumerate(status_data.get('shots', [])):
        if shot.get('status') == 'SUCCESS':
            # Construct shot key based on known S3 structure
            shot_key = f"{job_id}/{s3_prefix}/shot_{str(idx+1).zfill(4)}.mp4"
            
            # Verify the object exists
            try:
                s3_client.head_object(Bucket=bucket_name, Key=shot_key)
                
                shot_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={
                        'Bucket': bucket_name,
                        'Key': shot_key,
                        'ResponseContentDisposition': f'inline; filename="shot_{idx+1}.mp4"',
                        'ResponseContentType': 'video/mp4'
                    },
                    ExpiresIn=86400  # 24 hours
                )
                shot_urls.append(shot_url)
            except Exception as e:
                logger.error(f"Shot key {shot_key} does not exist in S3: {str(e)}")
        else:
            logger.warning(f"Shot {idx+1} failed with status: {shot.get('status')}")
    
    return {
        'full_video_url': full_video_url,
        'shot_urls': shot_urls
    }


def process_job_handler(event, context):
    """
    Lambda handler for processing video generation jobs.
    
    Args:
        event (dict): DynamoDB stream event
        context (object): Lambda context
    """
    for record in event['Records']:
        # Skip non-INSERT events
        if record.get('eventName') != 'INSERT':
            logger.info(f"Skipping non-INSERT event: {record.get('eventName')}")
            continue

        # Extract job ID from the event
        job_id = record['dynamodb']['NewImage']['job_id']['S']
        
        # Get the full job data
        job = table.get_item(Key={'job_id': job_id}).get('Item')
        
        # Skip already processed jobs
        if job and job.get('status') in ["PROCESSING", "COMPLETED"]:
            logger.info(f"Skipping already processed job {job_id}")
            continue

        try:
            # Update job status to PROCESSING
            update_job_status(job_id, 'PROCESSING')
            logger.info(f"Started processing job {job_id}")

            # Prepare model input based on job parameters
            model_input = prepare_model_input(job)

            # Start Bedrock async invocation
            logger.info(f"Starting Bedrock async invocation for job {job_id}")
            invocation = bedrock_runtime.start_async_invoke(
                modelId=os.environ['MODEL_ID'],
                modelInput=model_input,
                outputDataConfig={"s3OutputDataConfig": {"s3Uri": f"s3://{os.environ['BUCKET']}/{job_id}/"}}
            )
            invocation_arn = invocation["invocationArn"]
            logger.info(f"Started async invocation with ARN: {invocation_arn}")

            # Poll for completion status
            status = "InProgress"
            while status == "InProgress":
                response = bedrock_runtime.get_async_invoke(invocationArn=invocation_arn)
                status = response["status"]
                logger.info(f"Current status for job {job_id}: {status}")
                if status == "InProgress":
                    time.sleep(30)  # Wait 30 seconds before checking again

            # Handle completed job
            if status == "Completed":
                s3_prefix = invocation_arn.split('/')[-1]
                logger.info(f"Job {job_id} completed successfully. Processing outputs")

                # Generate pre-signed URLs for videos
                urls = generate_presigned_urls(job_id, s3_prefix)
                full_video_url = urls['full_video_url']
                shot_urls = urls['shot_urls']

                # Update DynamoDB with results
                table.update_item(
                    Key={'job_id': job_id},
                    UpdateExpression='SET #status = :status, video_url = :url, shots = :shots',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={
                        ':status': 'COMPLETED',
                        ':url': full_video_url,
                        ':shots': [{'url': url, 'index': idx+1} for idx, url in enumerate(shot_urls)]
                    }
                )
                logger.info(f"Stored video URL and {len(shot_urls)} shot URLs")

                # Get user information for notification
                user_id = job.get('user_id')
                user_email = job.get('user_email')
                
                if user_id and user_email:
                    task_type = job.get('task_type', 'Unknown')
                    prompt_preview = job.get('prompt', '')[:120] + ('...' if len(job.get('prompt', '')) > 120 else '')
                    shots_section = ""
                    if shot_urls:
                        shots_html = "".join(
                            f'<tr><td style="padding:6px 0;color:#555;">Shot {i+1}</td>'
                            f'<td style="padding:6px 0;"><a href="{url}" style="color:#FF9900;text-decoration:none;">▶ Watch Shot {i+1}</a></td></tr>'
                            for i, url in enumerate(shot_urls)
                        )
                        shots_section = f"""
                            <tr><td colspan="2" style="padding-top:16px;">
                                <p style="margin:0 0 8px;font-weight:600;color:#232F3E;">Individual Shots</p>
                                <table style="width:100%;border-collapse:collapse;">{shots_html}</table>
                            </td></tr>"""

                    html_body = f"""<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      <tr><td style="background:#232F3E;padding:24px 32px;">
        <h1 style="margin:0;color:#FF9900;font-size:22px;">&#127916; ContentCraft AI</h1>
        <p style="margin:4px 0 0;color:#aab7c4;font-size:13px;">Powered by Amazon Nova</p>
      </td></tr>
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 8px;color:#232F3E;font-size:18px;">&#9989; Your video is ready!</h2>
        <p style="margin:0 0 24px;color:#555;font-size:14px;">Your video generation job has completed successfully.</p>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr><td style="background:#FF9900;border-radius:6px;padding:12px 28px;">
            <a href="{full_video_url}" style="color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;">&#9654; Watch Your Video</a>
          </td></tr>
        </table>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:8px 0;color:#888;width:120px;">Job ID</td>
            <td style="padding:8px 0;color:#232F3E;font-family:monospace;">{job_id[:8]}...{job_id[-4:]}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:8px 0;color:#888;">Type</td>
            <td style="padding:8px 0;color:#232F3E;">{task_type.replace('_', ' ').title()}</td>
          </tr>
          {'<tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;color:#888;">Prompt</td><td style="padding:8px 0;color:#232F3E;">' + prompt_preview + '</td></tr>' if prompt_preview else ''}
          {shots_section}
        </table>
      </td></tr>
      <tr><td style="background:#f8f8f8;padding:16px 32px;border-top:1px solid #eee;">
        <p style="margin:0;color:#aaa;font-size:12px;text-align:center;">ContentCraft AI &nbsp;&#183;&nbsp; Built with Amazon Nova</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""

                    text_body = f"Your video is ready!\n\nJob ID: {job_id}\nType: {task_type}\nWatch: {full_video_url}"

                    # Send HTML email via SES
                    ses_client = boto3.client('ses')
                    ses_client.send_email(
                        Source=os.environ['SES_SENDER_EMAIL'],
                        Destination={'ToAddresses': [user_email]},
                        Message={
                            'Subject': {'Data': '🎬 Your video is ready! - ContentCraft AI'},
                            'Body': {
                                'Text': {'Data': text_body},
                                'Html': {'Data': html_body}
                            }
                        }
                    )
                    logger.info(f"HTML email sent via SES to {user_email} for job {job_id}")

                    # Also publish to SNS for any other subscribers
                    sns_client.publish(
                        TopicArn=os.environ['SNS_TOPIC_ARN'],
                        Subject=f"Video Generation Completed - Job {job_id}",
                        Message=text_body,
                        MessageAttributes={
                            'user_id': {'DataType': 'String', 'StringValue': user_id},
                            'user_email': {'DataType': 'String', 'StringValue': user_email}
                        }
                    )
                    logger.info(f"SNS notification sent for job {job_id} to user {user_id}")
                else:
                    logger.warning(f"No user information found for job {job_id}, skipping notification")
            else:
                # Handle failed job
                error_message = f'Bedrock processing failed with status: {status}'
                logger.error(f"Job {job_id} failed: {error_message}")
                update_job_status(job_id, 'FAILED', error_message)

        except Exception as e:
            # Handle exceptions
            error_message = str(e)
            logger.error(f"Exception occurred for job {job_id}: {error_message}", exc_info=True)
            update_job_status(job_id, 'FAILED', error_message)
