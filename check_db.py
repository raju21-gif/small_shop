import asyncio
from database import db
from bson import ObjectId

async def check_sales():
    print("--- SALES COLLECTION ---")
    sales = await db["sales"].find().to_list(100)
    for s in sales:
        print(s)
    
    print("\n--- PRODUCTS COLLECTION ---")
    products = await db["products"].find().to_list(100)
    for p in products:
        print(p)

if __name__ == "__main__":
    asyncio.run(check_sales())
