# Copyright 2026 Yicong Lin
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#     https://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import os
from openai import OpenAI
from dotenv import load_dotenv
import re
from datetime import datetime

load_dotenv()
client = OpenAI(
    base_url="https://models.github.ai/inference",
    api_key=os.getenv("GITHUB_TOKEN"))

def format_special_date(data):
    if not data or 'transaction' not in data:
        return data
    
    merchant_name = str(data.get('merchant', {}).get('name', '')).upper()
    raw_date = data['transaction'].get('date')

    # print(f"name:{merchant_name}, date:{raw_date}")

    if not raw_date:
        return data
    
    clean_date = raw_date.replace('/', '-')
    parts = [p.strip() for p in clean_date.split('-')]

    if len(parts) != 3:
        return data
    
    is_target = "DOLLARAMA" in merchant_name or "SUPERSTORE" in merchant_name
    if is_target:
        try:
            wrong_year = parts[0]
            month = parts[1]
            wrong_day = parts[2]

            actual_year_suffix = wrong_day[-2:]
            acutal_day = wrong_year[-2:]

            corrected_date = f"20{actual_year_suffix}-{month.zfill(2)}-{acutal_day.zfill(2)}"
            # print(f"corrected date: {corrected_date}")
            data['transaction']['date'] = corrected_date
        except Exception as e:
            print(f"Date swap error {e}")

    return data

async def analyze_receipt(image_urls: list[str]):
    """
    Uses optimized system and user prompts for high-accuracy JSON output. (T2.03, T3.01)
    
    :param image_url: link to the image to be analyzed
    :type image_url: str
    """

    # SYSTEM PROMPT: Defines the AI's persona and logic constraints
    # system_prompt = (
    #     "You are a highly accurate OCR and data extraction assistant specialized in receipt processing. "
    #     "Your goal is to extract key information from receipt images and convert it into a valid JSON format. "
    #     "Follow these rules strictly:\n"
    #     "- Output ONLY valid JSON. Do not include any conversational filler, preamble, or markdown code blocks.\n"
    #     "- Ensure all prices, quantities, and totals are numbers (float/integer), not strings.\n"
    #     "- If a value is missing or unreadable, set its value to null.\n"
    #     "- Standardize item names by removing extraneous characters while preserving the original language."
    # )
    system_prompt = (
        "You are a highly accurate OCR and data extraction assistant specialized in receipt processing."
        "Your goal is to extract key information from one or more receipt images (which may be parts of "
        "a single long receipt or multiple related receipts) and convert them into a single consolidated "
        "JSON format.\n"
        "Follow these rules strictly:\n"
        "- Image Consolidation: If multiple images are provided, treat them as a continuous sequence. "
        "Identify overlapping areas to avoid duplicate line items.\n"
        "- Output Structure: Output ONLY a single valid JSON object. Do not include any conversational "
        "filler, preamble, or markdown code blocks.\n"
        "- Data Types: Ensure all prices, quantities, and totals are numbers (float/integer), not strings.\n"
        "- Missing Data: If a value is missing or unreadable across all images, set its value to null.\n"
        "- Standardization: Standardize item names by removing extraneous characters while preserving the "
        "original language.\n"
        "- Mathematical Integrity: Verify that the sum of all items equals the subtotal and total. If there "
        "is a discrepancy due to OCR errors, prioritize the most legible numerical value."
    )
    
    # USER PROMPT: Defines the specific task and output format
    # user_prompt = (
    #     "Please analyze this receipt image and extract the data into the following JSON schema:\n\n"
    #     "{\n"
    #     "  \"merchant\": {\"name\": \"string or null\", \"address\": \"string or null\", \"phone\": \"string or null\"},\n"
    #     "  \"transaction\": {\"date\": \"YYYY-MM-DD\", \"time\": \"HH:mm\", \"receipt_number\": \"string or null\"},\n"
    #     "  \"items\": [\n"
    #     "    {\"name\": \"string\", \"quantity\": number, \"price_per_unit\": number, \"total_price\": number}\n"
    #     "  ],\n"
    #     "  \"totals\": {\"subtotal\": number, \"tax\": number, \"total\": number, \"currency\": \"string\"},\n"
    #     "  \"payment_method\": \"string\"\n"
    #     "}\n\n"
    #     "Ensure the output is a single, flat JSON object.\n"
    #     "Special Instruction: Please perform a row-by-row cross-check. Ensure that the price on the right strictly "
    #     "belongs to the item name on the same horizontal line. If an item name spans multiple lines, make sure to "
    #     "capture the correct total price associated with it."
    # )
    user_prompt = (
        "Please analyze the provided set of receipt images. These images represent segments of a single long "
        "receipt or a collection of related transactions. Combine them into the following JSON schema:\n\n"
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
        "Specific Instructions for Multi-Image/Long Receipts:\n"
        "- Deduplication: If an item appears at the bottom of one image and the top of the next, count it only once.\n"
        "- Row Alignment: Perform a row-by-row cross-check. Ensure the price on the right strictly belongs to the item "
        "name on the same horizontal line, even if the line is split across two images.\n"
        "- Continuity: If a merchant's name is in image 1 and the total is in image 3, ensure they are correctly linked "
        "in the final JSON.\n"
        "- Final Check: Ensure the output is a single, flat JSON object representing the entire transaction(s).\n"
    )

    content = [{"type": "text", "text": user_prompt}]
    for url in image_urls:
        content.append({"type": "image_url", "image_url": {"url": url}})

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
                    "content": content
                }
            ],
            response_format={ "type": "json_object" }
        )
        result = json.loads(response.choices[0].message.content)
        return format_special_date(result)
    except Exception as e:
        print(f"Extraction Error: {str(e)}")
        return None