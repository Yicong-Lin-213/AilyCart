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

import re
import os
from dotenv import load_dotenv
from thefuzz import process, fuzz
from supabase import create_client, Client
from datetime import datetime, timezone

load_dotenv()

class DataCleaner:
    def __init__(self):
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        self.supabase: Client = create_client(url, key)

        self.abbreviation_map = {}
        self.standard_products = {}

        self.refrensh_knowledge_base()

    def refrensh_knowledge_base(self):
        abbr_res = self.supabase.table("abbreviation_mapping").select("raw_text, standard_text").execute()
        self.abbreviation_map = {item['raw_text']: item['standard_text'] for item in abbr_res.data}

        product_res = self.supabase.table("standard_products").select("id, full_name").eq("is_verified", True).execute()
        self.standard_products = {item['full_name']: item['id'] for item in product_res.data}
        self.standard_products_names = list(self.standard_products.keys())

    def _special_translate(self, text):
        text = re.sub(r'(\d+)\s*LB\b', r'\1 POUND', text)
        words = text.split()
        translated_words = []
        for i, word in enumerate(words):
            if word == "LB":
                translated_words.append("Life Brand")
            else:
                translated_words.append(self.abbreviation_map.get(word, word))
        return " ".join(translated_words)

    def _clean_single_name(self, raw_name):
        if not raw_name: return "Unknown Item"
        text = raw_name.upper()
        text = re.sub(r"[^A-Z0-9\s]", "", text).strip()
        
        processed_text = self._special_translate(text)

        if not self.standard_products_names:
            return {"name": processed_text.title(), "standard_product_id": None}

        match_name, score = process.extractOne(processed_text, self.standard_products_names, scorer=fuzz.token_set_ratio)
        if score >= 75:
            matched_id = self.standard_products[match_name]
            return {"name": match_name, "standard_product_id": matched_id}
        else:
            return {"name": processed_text.title(), "standard_product_id": None}

    def standardize_data(self, data):
        processed_data = data.copy()

        if "items" in processed_data:
            new_items = []
            for item in processed_data["items"]:
                cleaned_item = self._clean_single_name(item.get("name", ""))
                new_item = {
                    **item,
                    "name": cleaned_item["name"],
                    "standard_product_id": cleaned_item["standard_product_id"]  
                }
                new_items.append(new_item)
            processed_data["items"] = new_items

        return processed_data

    def archive_receipt(self, user_id, receipt_data, name_mapping):
        transaction = receipt_data.get("transaction", {})
        raw_date = transaction.get("date")
        raw_time = transaction.get("time")
        if raw_date:
            actual_timestamp = f"{raw_date} {raw_time if raw_time else '12:00'}"
            actual_timestamp = datetime.strptime(actual_timestamp, "%Y-%m-%d %H:%M")
            actual_timestamp = actual_timestamp.replace(tzinfo=timezone.utc).isoformat()
        else:
            actual_timestamp = datetime.utcnow().isoformat()

        items_payload = []
        for item in receipt_data.get("items", []):
            items_payload.append({
                "item_name": item["name"],
                "standard_product_id": item["standard_product_id"],
                "quantity": item.get("quantity", 1),
                "unit_price": item.get("price_per_unit", 0),
                "total_price": item.get("total_price", 0)
            })
        try:
            rpc_params = {
                "p_user_id": user_id,
                "p_total_amount": receipt_data.get("totals", {}).get("total", 0),
                "p_image_url": receipt_data["image_url_base"],
                "p_image_count": receipt_data["image_count"],
                "p_actual_time": actual_timestamp,
                "p_items": items_payload
            }

            print("Archiving rpc_params:", rpc_params)
            rpc_res = self.supabase.rpc("archive_receipt_with_items", rpc_params).execute()
            print("Archiving rpc_res:", rpc_res)

            # Update inventory predictions
            self.supabase.rpc("update_inventory_predictions", {}).execute()
            
            return {"status": "success", "receipt_id": rpc_res.data, "message": "Receipt archived successfully"}
        except Exception as e:
            print("Archiving error:", e)
            return {"status": "error", "message": f"Failed to archive receipt: {str(e)}"}