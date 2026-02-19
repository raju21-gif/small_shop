from fastapi import FastAPI, Body, HTTPException, status, Depends
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List, Optional
from datetime import datetime, timedelta
from models import ProductModel, ProductUpdateModel, SaleModel, UserCreate, UserModel, Token, StockModel
from database import db
from bson import ObjectId
import httpx
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
import jwt

load_dotenv()

app = FastAPI(title="Small Business Inventory API")

# Auth Setup
SECRET_KEY = os.getenv("SECRET_KEY", "yoursupersecretkeyforinventoryapp")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helper functions for Auth
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db["users"].find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

# Auth Routes
@app.post("/register", response_model=UserModel)
async def register(user: UserCreate):
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    existing_user = await db["users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "username": user.username,
        "email": user.email,
        "image_url": user.image_url,
        "role": "staff", # Default to staff for public registration
        "hashed_password": get_password_hash(user.password)
    }
    new_user = await db["users"].insert_one(user_dict)
    created_user = await db["users"].find_one({"_id": new_user.inserted_id})
    return created_user

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # Here form_data.username will contain the user's email
    user = await db["users"].find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserModel)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

# --- Admin User Management Routes ---

@app.get("/users")
async def list_users(current_user: dict = Depends(get_current_user)):
    try:
        if current_user.get("role") != "admin" and current_user.get("username") != "Admin":
             raise HTTPException(status_code=403, detail="Not authorized")
             
        users = await db["users"].find().to_list(1000)
        
        # Manual serialization to handle legacy data/ObjectId
        results = []
        for u in users:
            # Convert ObjectId to string but keep key as _id for frontend compatibility
            u["_id"] = str(u["_id"])
            # Ensure email exists for frontend table
            if "email" not in u:
                u["email"] = "N/A" # or copy username if valid
            results.append(u)
            
        return results
    except Exception as e:
        print(f"ERROR listing users: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/admin/users", response_model=UserModel)
async def create_user_admin(user: UserCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    existing_user = await db["users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "username": user.username,
        "email": user.email,
        "image_url": user.image_url,
        "role": user.role, # Allow admin to set role
        "hashed_password": get_password_hash(user.password)
    }
    new_user = await db["users"].insert_one(user_dict)
    created_user = await db["users"].find_one({"_id": new_user.inserted_id})
    return created_user

@app.delete("/users/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Prevent self-deletion
    if str(current_user["_id"]) == id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
    delete_result = await db["users"].delete_one({"_id": ObjectId(id)})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return JSONResponse(status_code=204)

# ------------------------------------

# Protected Product Routes
@app.post("/products", response_description="Add new product", response_model=ProductModel, response_model_by_alias=True)
async def create_product(product: ProductModel = Body(...), current_user: dict = Depends(get_current_user)):
    try:
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can add products")
            
        product_dict = jsonable_encoder(product)
        if "id" in product_dict: del product_dict["id"]
        if "_id" in product_dict: del product_dict["_id"]
        
        new_product = await db["products"].insert_one(product_dict)
        created_product = await db["products"].find_one({"_id": new_product.inserted_id})
        return JSONResponse(status_code=status.HTTP_201_CREATED, content=jsonable_encoder(created_product))
    except Exception as e:
        print(f"ERROR creating product: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/products", response_description="List all products", response_model=List[ProductModel], response_model_by_alias=True)
async def list_products(current_user: dict = Depends(get_current_user)):
    products = await db["products"].find().to_list(1000)
    return products

@app.get("/products/{id}", response_description="Get a single product", response_model=ProductModel, response_model_by_alias=True)
async def show_product(id: str, current_user: dict = Depends(get_current_user)):
    if (product := await db["products"].find_one({"_id": ObjectId(id)})) is not None:
        return product
    raise HTTPException(status_code=404, detail=f"Product {id} not found")

@app.put("/products/{id}", response_description="Update a product", response_model=ProductModel, response_model_by_alias=True)
async def update_product(id: str, product: ProductUpdateModel = Body(...), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update products")
        
    product = {k: v for k, v in product.model_dump().items() if v is not None}

    if len(product) >= 1:
        update_result = await db["products"].update_one({"_id": ObjectId(id)}, {"$set": product})

        if update_result.modified_count == 1:
            if (
                updated_product := await db["products"].find_one({"_id": ObjectId(id)})
            ) is not None:
                return updated_product

    if (existing_product := await db["products"].find_one({"_id": ObjectId(id)})) is not None:
        return existing_product

    raise HTTPException(status_code=404, detail=f"Product {id} not found")

@app.delete("/products/{id}", response_description="Delete a product")
async def delete_product(id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete products")
        
    delete_result = await db["products"].delete_one({"_id": ObjectId(id)})

    if delete_result.deleted_count == 1:
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT)

    raise HTTPException(status_code=404, detail=f"Product {id} not found")

@app.post("/sales", response_description="Record a sale")
async def record_sale(sale: SaleModel = Body(...), current_user: dict = Depends(get_current_user)):
    sale_data = jsonable_encoder(sale)
    if "id" in sale_data: del sale_data["id"]
    if "_id" in sale_data: del sale_data["_id"]

    product = await db["products"].find_one({"_id": ObjectId(sale.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Enrich with product details at time of sale
    sale_data["product_name"] = product["name"]
    sale_data["unit_price"] = product["price"]
    sale_data["total_price"] = product["price"] * sale.quantity_sold
    
    # Automatically attach user info
    if not sale_data.get("user_id"):
        sale_data["user_id"] = str(current_user["_id"])
        sale_data["user_name"] = current_user["username"]

    # Initial status is pending unless admin overrides (staying simple for now)
    sale_data["status"] = "pending"

    if product["current_stock"] < sale.quantity_sold:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    # NOTE: Stock is NOT decremented here. It happens on Admin Approval.
    new_sale = await db["sales"].insert_one(sale_data)
    
    # Simulation: Notify Admin (Printing to console)
    print(f"NOTIFICATION [To Admin]: New order request from {sale_data['user_name']} for {sale_data['product_name']} ({sale.quantity_sold} qty)")
    
    return JSONResponse(status_code=status.HTTP_201_CREATED, content=jsonable_encoder({"id": str(new_sale.inserted_id), "status": "pending"}))

@app.get("/admin/orders", response_description="List all orders for admin management")
async def list_admin_orders(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage orders")
        
    orders = await db["sales"].find().sort("timestamp", -1).to_list(1000)
    print(f"DEBUG: Found {len(orders)} orders for admin")
    for order in orders:
        try:
            order["_id"] = str(order["_id"])
            
            # Migration-on-the-fly: Fill missing fields for old data with safety
            if ("product_name" not in order or not order["product_name"]) and order.get("product_id"):
                pid = order["product_id"]
                if ObjectId.is_valid(pid):
                    product = await db["products"].find_one({"_id": ObjectId(pid)})
                    if product:
                        order["product_name"] = product["name"]
                        if "unit_price" not in order: order["unit_price"] = product["price"]
                        if "total_price" not in order: order["total_price"] = product["price"] * order.get("quantity_sold", 0)
            
            if ("user_name" not in order or not order["user_name"]) and order.get("user_id"):
                uid = order["user_id"]
                if ObjectId.is_valid(uid):
                    user = await db["users"].find_one({"_id": ObjectId(uid)})
                    if user:
                        order["user_name"] = user["username"]
                        
            if "status" not in order:
                order["status"] = "pending"
        except Exception as e:
            print(f"Error enriching order {order.get('_id')}: {e}")
            
    return orders

@app.post("/admin/orders/{id}/approve", response_description="Approve and process an order")
async def approve_order(id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can approve orders")
    
    order = await db["sales"].find_one({"_id": ObjectId(id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["status"] == "approved":
        return {"message": "Order already approved"}

    product = await db["products"].find_one({"_id": ObjectId(order["product_id"])})
    if not product:
        raise HTTPException(status_code=404, detail="Product no longer exists")
        
    if product["current_stock"] < order["quantity_sold"]:
        raise HTTPException(status_code=400, detail="Insufficient stock to approve order")

    # 1. Decrement Stock
    await db["products"].update_one(
        {"_id": ObjectId(order["product_id"])},
        {"$inc": {"current_stock": -order["quantity_sold"]}}
    )
    
    # 2. Update Order Status
    await db["sales"].update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "approved"}}
    )
    
    # Simulation: Notify User (Printing to console)
    user_email = "User" # Default
    user = await db["users"].find_one({"_id": ObjectId(order["user_id"])})
    if user: user_email = user["email"]
    
    print(f"NOTIFICATION [To Email]: Sent to {user_email} - Your order for {order['product_name']} has been APPROVED and PLACED!")
    
    return {"status": "approved", "message": "Order approved and stock updated"}

@app.post("/stock", response_description="Upload current stock", status_code=status.HTTP_201_CREATED)
async def upload_stock(stock: StockModel = Body(...), current_user: dict = Depends(get_current_user)):
    try:
        stock_data = jsonable_encoder(stock)
        print(f"DEBUG: stock_data before insert: {stock_data}")
        if "id" in stock_data: del stock_data["id"]
        if "_id" in stock_data and stock_data["_id"] is None: del stock_data["_id"]
        
        # 1. Log to stock collection
        new_stock = await db["stock"].insert_one(stock_data)
        
        # 2. Sync to products collection (Marketplace)
        # We check if product already exists by name
        product = await db["products"].find_one({"name": stock.product_name})
        if product:
            await db["products"].update_one(
                {"_id": product["_id"]},
                {
                    "$inc": {"current_stock": stock.quantity},
                    "$set": {"price": stock.price} # Update price during stock upload
                }
            )
        else:
            # Create new product with provided price
            new_product = {
                "name": stock.product_name,
                "category": stock.category,
                "price": stock.price,
                "current_stock": stock.quantity,
                "low_stock_threshold": 10
            }
            await db["products"].insert_one(new_product)
            
        return {"id": str(new_stock.inserted_id), "message": "Stock logged and Marketplace synced"}
    except Exception as e:
        print(f"ERROR in upload_stock: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/orders/me")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    orders = await db["sales"].find({"user_id": user_id}).sort("timestamp", -1).to_list(1000)
    
    results = []
    for order in orders:
        order["_id"] = str(order["_id"])
        # Ensure product_name is present (legacy or new)
        if "product_name" not in order:
            product = await db["products"].find_one({"_id": ObjectId(order["product_id"])})
            order["product_name"] = product["name"] if product else "Unknown Product"
        results.append(order)
    return results

@app.get("/prediction", response_description="Get inventory predictions")
async def get_predictions(current_user: dict = Depends(get_current_user)):
    from ai_engine import StockPredictor
    predictor = StockPredictor()
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # 1. Get List of all products
    products = await db["products"].find().to_list(1000)
    
    predictions = []
    
    for product in products:
        product_id = str(product["_id"])
        
        # 2. Get daily sales history for this product
        pipeline = [
            {
                "$match": {
                    "product_id": product_id,
                    "timestamp": {"$gte": thirty_days_ago}
                }
            },
            {
                "$project": {
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                    "quantity_sold": 1
                }
            },
            {
                "$group": {
                    "_id": "$date",
                    "daily_total": {"$sum": "$quantity_sold"}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        daily_sales_cursor = await db["sales"].aggregate(pipeline).to_list(1000)
        
        # Convert to format expected by AI Engine
        sales_history = [
            {'date': datetime.strptime(d["_id"], "%Y-%m-%d"), 'quantity': d["daily_total"]}
            for d in daily_sales_cursor
        ]
        
        # 3. Predict
        predicted_need = predictor.predict_future_demand(sales_history, days_to_predict=7)
        
        predictions.append({
            "product_name": product["name"],
            "current_stock": product["current_stock"],
            "predicted_need": predicted_need,
            "status": "Shortage Dept" if product["current_stock"] < predicted_need else "Stocked"
        })
            
    return predictions

# AI Chat Proxy
@app.post("/ai/chat")
async def ai_chat_proxy(payload: dict = Body(...)):
    user_message = payload.get("message")
    if not user_message:
        raise HTTPException(status_code=400, detail="Message is required")

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI API Key not configured on server")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:8080",
                    "X-Title": "ShopManager AI"
                },
                json={
                    "model": "deepseek/deepseek-r1",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful AI assistant for ShopManager, a software for small business inventory and sales management. Provide direct, helpful answers. Avoid technical jargon or showing your internal thought process."
                        },
                        { "role": "user", "content": user_message }
                    ]
                },
                timeout=60.0
            )
            
            if response.status_code != 200:
                print(f"OpenRouter Error: {response.text}")
                raise HTTPException(status_code=response.status_code, detail="Error from AI service")
                
            return response.json()
            
    except Exception as e:
        print(f"Chat Proxy Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Serve Frontend Static Files
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
