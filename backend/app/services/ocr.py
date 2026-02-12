import json
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(
    base_url="https://models.github.ai/inference",
    api_key=os.getenv("GITHUB_TOKEN"))

async def analyze_receipt(image_url: str):
    """
    Uses optimized system and user prompts for high-accuracy JSON output. (T2.03, T3.01)
    
    :param image_url: link to the image to be analyzed
    :type image_url: str
    """

    # SYSTEM PROMPT: Defines the AI's persona and logic constraints
    system_prompt = (
        "You are a highly accurate OCR and data extraction assistant specialized in receipt processing. "
        "Your goal is to extract key information from receipt images and convert it into a valid JSON format. "
        "Follow these rules strictly:\n"
        "- Output ONLY valid JSON. Do not include any conversational filler, preamble, or markdown code blocks.\n"
        "- Ensure all prices, quantities, and totals are numbers (float/integer), not strings.\n"
        "- If a value is missing or unreadable, set its value to null.\n"
        "- Standardize item names by removing extraneous characters while preserving the original language."
    )    
    
    # USER PROMPT: Defines the specific task and output format
    user_prompt = (
        "Please analyze this receipt image and extract the data into the following JSON schema:\n\n"
        "{\n"
        "  \"merchant\": {\"name\": \"string or null\", \"address\": \"string or null\", \"phone\": \"string or null\"},\n"
        "  \"transaction\": {\"date\": \"YYYY-MM-DD\", \"time\": \"HH:mm\", \"receipt_number\": \"string or null\"},\n"
        "  \"items\": [\n"
        "    {\"name\": \"string\", \"quantity\": number, \"price_per_unit\": number, \"total_price\": number}\n"
        "  ],\n"
        "  \"totals\": {\"subtotal\": number, \"tax\": number, \"total\": number, \"currency\": \"string\"},\n"
        "  \"payment_method\": \"string\"\n"
        "}\n\n"
        "Ensure the output is a single, flat JSON object.\n"
        "Special Instruction: Please perform a row-by-row cross-check. Ensure that the price on the right strictly "
        "belongs to the item name on the same horizontal line. If an item name spans multiple lines, make sure to "
        "capture the correct total price associated with it."
    )
    try:
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": system_prompt
                },
                {
                    "role": "user", 
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {"type": "image_url", "image_url": {"url": image_url}}
                    ]
                }
            ],
            response_format={ "type": "json_object" }
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Extraction Error: {str(e)}")
        return None