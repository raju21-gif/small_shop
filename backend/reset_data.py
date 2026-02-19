import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "small_shop_inventory"

async def reset_database():
    print(f"Connecting to {MONGODB_URL}...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Collections to clear
    collections = ["products", "sales", "stock"]
    
    for collection in collections:
        count = await db[collection].count_documents({})
        print(f"Deleting {count} documents from '{collection}'...")
        await db[collection].delete_many({})
        print(f"Collection '{collection}' is now empty.")
    
    print("\n[OK] Database cleanup complete! All stock and sales data removed.")
    client.close()

if __name__ == "__main__":
    asyncio.run(reset_database())
