import asyncio
from database import db
from passlib.context import CryptContext

# Setup Password Hashing (Same as main.py)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def seed_admin():
    print("Checking for default admin user...")
    admin_email = "admin@shopmanager.com"
    
    existing_admin = await db["users"].find_one({"email": admin_email})
    
    if not existing_admin:
        admin_user = {
            "username": "Admin",
            "email": admin_email,
            "hashed_password": get_password_hash("admin123"),
            "role": "admin",
            "image_url": ""
        }
        await db["users"].insert_one(admin_user)
        print(f"[SUCCESS] Admin user created: {admin_email}")
        print("Password: admin123")
    else:
        print(f"[INFO] Admin user already exists: {admin_email}")

if __name__ == "__main__":
    # Run the async function
    asyncio.run(seed_admin())
