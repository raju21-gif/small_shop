import asyncio
from database import db

async def clear_sales():
    print("Clearing all order requests from Database...")
    result = await db["sales"].delete_many({})
    print(f"Successfully deleted {result.deleted_count} order requests.")

if __name__ == "__main__":
    asyncio.run(clear_sales())
