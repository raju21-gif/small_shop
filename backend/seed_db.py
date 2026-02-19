import asyncio
from datetime import datetime, timedelta
import random
from backend.database import db
from backend.models import ProductModel, SaleModel
from fastapi.encoders import jsonable_encoder

async def seed_data():
    print("Testing MongoDB connection and seeding dummy data...")
    
    # 1. Clear existing data (optional, but good for a clean test)
    await db["products"].delete_many({})
    await db["sales"].delete_many({})
    print("Cleared existing collections.")

    # 2. Add Dummy Products
    dummy_products = [
        {"name": "Apples", "category": "Produce", "price": 1.2, "current_stock": 50, "low_stock_threshold": 20},
        {"name": "Milk", "category": "Dairy", "price": 3.5, "current_stock": 15, "low_stock_threshold": 10},
        {"name": "Bread", "category": "Bakery", "price": 2.0, "current_stock": 30, "low_stock_threshold": 15},
        {"name": "Eggs (12pk)", "category": "Dairy", "price": 4.0, "current_stock": 8, "low_stock_threshold": 12},
        {"name": "Pen", "category": "Stationery", "price": 0.5, "current_stock": 100, "low_stock_threshold": 20}
    ]

    product_ids = []
    for p_data in dummy_products:
        product = ProductModel(**p_data)
        encoded_product = jsonable_encoder(product)
        # Note: We let MongoDB generate the _id by removing the None id
        if "id" in encoded_product: del encoded_product["id"]
        if "_id" in encoded_product: del encoded_product["_id"]
        
        result = await db["products"].insert_one(encoded_product)
        product_ids.append(str(result.inserted_id))
        print(f"Added product: {p_data['name']} with ID: {result.inserted_id}")

    # 3. Add Dummy Sales for the last 30 days (to test prediction)
    print("Seeding dummy sales history...")
    for pid in product_ids:
        # Generate random sales for each product
        for i in range(30):
            days_ago = i
            timestamp = datetime.utcnow() - timedelta(days=days_ago)
            quantity = random.randint(1, 10)
            
            sale = {
                "product_id": pid,
                "quantity_sold": quantity,
                "timestamp": timestamp
            }
            await db["sales"].insert_one(sale)
    
    print("Seeding complete! Database is ready.")

if __name__ == "__main__":
    asyncio.run(seed_data())
