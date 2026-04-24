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

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from typing import Optional, List
import os
from groq import Groq
from app.services.ocr import analyze_receipt
from app.services.data_cleaner import DataCleaner
from app.services.tts import processAudio

load_dotenv()
app = FastAPI(title="AilyCart Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeReceiptRequest(BaseModel):
    image_url: Optional[str] = None
    image_urls: Optional[list[str]] = None

class ArchiveReceiptRequest(BaseModel):
    user_id: str
    receipt_data: dict
    name_mapping: Optional[dict] = None

class AudioProcessRequest(BaseModel):
    user_id: Optional[str] = None
    audio: UploadFile = File(...)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend is running!"}

@app.get("/version")
async def get_version():
    return {"version": "1.0.1"}

@app.post("/api/v1/process-audio")
async def process_audio(audio: UploadFile = File(...), user_id: Optional[str] = Form(None)):
    print("Processing audio...")
    result = await processAudio(audio, user_id)
    return result

@app.post("/api/v1/archive-receipt")
async def archive_receipt(request: ArchiveReceiptRequest):
    cleaner = DataCleaner()
    result = cleaner.archive_receipt(request.user_id, request.receipt_data, request.name_mapping)
    return {"status": "success"}

@app.post("/api/v1/process-receipt")
async def process_receipt(request: AnalyzeReceiptRequest):
    target_urls = []
    if request.image_urls and len(request.image_urls) > 0:
        target_urls = request.image_urls
    elif request.image_url:
        target_urls = [request.image_url]
    
    if not target_urls:
        raise HTTPException(status_code=400, detail="No image URLs provided")

    image_url_base = os.path.commonprefix(target_urls)
    image_count = len(target_urls)

    print("Processing receipt:", target_urls)
    data = await analyze_receipt(target_urls)
    if not data:
        raise HTTPException(status_code=500, detail="Failed to extract receipt data")

    cleaner = DataCleaner()
    standardized_data = cleaner.standardize_data(data)
    standardized_data["image_url_base"] = image_url_base
    standardized_data["image_count"] = image_count
    
    return {"status": "success", "payload": standardized_data}