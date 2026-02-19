import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def cleanup_sales():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["small_shop_inventory"]
    
    # Delete records where user_id is missing or None
    result = await db["sales"].delete_many({
        "$or": [
            {"user_id": {"$exists": False}},
            {"user_id": None},
            {"product_id": {"$exists": False}},
            {"product_id": None}
        ]
    })
    print(f"Deleted {result.deleted_count} malformed sales records.")

if __name__ == "__main__":
    asyncio.run(cleanup_sales())
