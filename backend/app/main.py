from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from typing import Optional, List

from app.services.ocr import analyze_receipt

load_dotenv()
app = FastAPI(title="AilyCart Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReceiptRequest(BaseModel):
    image_url: Optional[str] = None
    image_urls: Optional[list[str]] = None

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend is running!"}

@app.post("/api/v1/process-receipt")
async def process_receipt(request: ReceiptRequest):
    target_urls = []
    if request.image_urls and len(request.image_urls) > 0:
        target_urls = request.image_urls
    elif request.image_url:
        target_urls = [request.image_url]
    
    if not target_urls:
        raise HTTPException(status_code=400, detail="No image URLs provided")
        
    data = await analyze_receipt(target_urls)
    if not data:
        raise HTTPException(status_code=500, detail="Failed to extract receipt data")
    
    return {"status": "success", "payload": data}