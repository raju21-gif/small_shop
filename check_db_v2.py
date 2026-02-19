import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from bson import ObjectId

async def check_sales():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["small_shop_inventory"] # Updated database name
    
    print("--- SALES COLLECTION ---")
    sales = await db["sales"].find().to_list(100)
    if not sales:
        print("No sales found in database.")
    for s in sales:
        print(f"ID: {s.get('_id')}, ProductID: {s.get('product_id')}, UserID: {s.get('user_id')}, Status: {s.get('status')}")
        if not ObjectId.is_valid(s.get('product_id')):
            print(f"  WARNING: Invalid product_id: {s.get('product_id')}")
        if not ObjectId.is_valid(s.get('user_id')):
            print(f"  WARNING: Invalid user_id: {s.get('user_id')}")

if __name__ == "__main__":
    asyncio.run(check_sales())
