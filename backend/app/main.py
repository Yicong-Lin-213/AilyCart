from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

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
    image_url: str

@app.post("/api/v1/process-receipt")
async def process_receipt(request: ReceiptRequest):
    data = await analyze_receipt(request.image_url)
    if not data:
        raise HTTPException(status_code=500, detail="Failed to extract receipt data")
    
    return {"status": "success", "payload": data}