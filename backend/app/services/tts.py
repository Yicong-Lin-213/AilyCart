import os
from typing import Optional
from dotenv import load_dotenv
from fastapi import UploadFile
from supabase import create_client, Client
from groq import Groq

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

def extract_item_name(text: str):
    keywords = ["check", "price of", "how much is", "how much does", "find", "tell me about", "what is the price of"]
    text = text.lower().replace("?", "").replace(".", "")

    for keyword in keywords:
        if keyword in text:
            return text.split(keyword)[-1].strip()
    
    return text.strip()

async def processAudio(audio_file: UploadFile, user_id: Optional[str] = None):
    try:
        audio_data = await audio_file.read()
        transcript = groq_client.audio.transcriptions.create(
            file=(audio_file.filename, audio_data),
            model="whisper-large-v3",
            response_format="json",
            language="en"
        )

        raw_text = transcript.text
        print("Transcript:", raw_text)
        item_name = extract_item_name(raw_text)

        if not item_name:
            return {"success": False, "feedback": "I didn't hear the item name clearly."}
        
        print ("Searching for item:", item_name, "for user:", user_id)
        
        response = supabase.table("inventory_items") \
            .select("item_name, unit_price, last_purchased_at") \
            .eq("user_id", user_id) \
            .ilike("item_name", f"%{item_name.strip()}%") \
            .order("last_purchased_at", desc=True) \
            .limit(1) \
            .execute()
                
        if response.data:
            item = response.data[0]
            name = item["item_name"]
            price = item["unit_price"]
            last_purchased_at = item["last_purchased_at"][:10]
            feedback = f"The last {name} was purchased on {last_purchased_at} for ${price:.2f}."
            return {
                "success": True,
                "feedback": feedback,
                "raw_text": raw_text,
                "data": item
            }
        else:
            feedback = f"I'm sorry, I couldn't find any record of {item_name} in your inventory."
            return {
                "success": False,
                "feedback": feedback,
                "raw_text": raw_text,
                "data": None
            }
        
    except Exception as e:
        print("Error processing audio:", e)
        return {"success": False, "feedback": f"An error occurred: {str(e)}"}