"""
Director Agent Lambda — uses Amazon Nova to reason about a high-level creative goal
and produce a structured multi-shot video production plan.
"""

import json
import os
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

bedrock = boto3.client("bedrock-runtime")

SYSTEM_PROMPT = """You are an expert video director and cinematographer. 
Given a high-level creative goal, you produce a detailed multi-shot video production plan.

You must respond with ONLY valid JSON in this exact structure:
{
  "title": "Project title",
  "reasoning": "Brief explanation of your creative decisions (2-3 sentences)",
  "total_duration": <number, multiple of 6, between 12 and 120>,
  "style": "Overall visual style description",
  "shots": [
    {
      "shot_number": 1,
      "prompt": "Detailed cinematic prompt for this shot (be specific about camera angle, lighting, movement, subject)",
      "duration": 6,
      "purpose": "What this shot achieves narratively"
    }
  ]
}

Rules:
- Each shot duration must be exactly 6 seconds
- Total shots: between 2 and 20
- total_duration = number_of_shots * 6
- Prompts must be vivid, cinematic, and specific (50-150 words each)
- Think like a director: establish, develop, resolve
"""


def director_handler(event, context):
    try:
        # Auth check
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        if not claims.get("sub"):
            return _response(401, {"error": "Authentication required"})

        body = json.loads(event.get("body", "{}"))
        goal = body.get("goal", "").strip()
        style_hint = body.get("style_hint", "").strip()  # optional

        if not goal or len(goal) < 10:
            return _response(400, {"error": "Please provide a goal (min 10 characters)"})
        if len(goal) > 1000:
            return _response(400, {"error": "Goal too long (max 1000 characters)"})

        user_message = f"Creative goal: {goal}"
        if style_hint:
            user_message += f"\nStyle preference: {style_hint}"

        logger.info(f"Director agent processing goal: {goal[:100]}")

        # Call Nova via Converse API
        response = bedrock.converse(
            modelId=os.environ["DIRECTOR_MODEL_ID"],
            system=[{"text": SYSTEM_PROMPT}],
            messages=[{"role": "user", "content": [{"text": user_message}]}],
            inferenceConfig={"maxTokens": 4096, "temperature": 0.7}
        )

        raw_text = response["output"]["message"]["content"][0]["text"]
        logger.info(f"Nova response: {raw_text[:200]}")

        # Parse and validate the plan
        plan = _parse_and_validate(raw_text)

        return _response(200, plan)

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Nova response as JSON: {e}")
        return _response(500, {"error": "Agent returned invalid plan. Please try again."})
    except Exception as e:
        logger.error(f"Director agent error: {e}", exc_info=True)
        return _response(500, {"error": str(e)})


def _parse_and_validate(raw_text: str) -> dict:
    """Extract and validate JSON from Nova's response."""
    # Strip markdown code fences if present
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    plan = json.loads(text)

    # Validate required fields
    required = ["title", "reasoning", "total_duration", "shots"]
    for field in required:
        if field not in plan:
            raise ValueError(f"Missing field: {field}")

    shots = plan["shots"]
    if not isinstance(shots, list) or len(shots) < 2 or len(shots) > 20:
        raise ValueError("shots must be a list of 2-20 items")

    for i, shot in enumerate(shots):
        if not shot.get("prompt"):
            raise ValueError(f"Shot {i+1} missing prompt")
        shot["shot_number"] = i + 1
        shot["duration"] = 6  # enforce 6s per shot

    plan["total_duration"] = len(shots) * 6

    return plan


def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        "body": json.dumps(body)
    }
