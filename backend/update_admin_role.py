import asyncio
from database import db

async def update_admin_role():
    admin_email = "admin@shopmanager.com"
    print(f"Updating role for {admin_email}...")
    
    result = await db["users"].update_one(
        {"email": admin_email},
        {"$set": {"role": "admin"}}
    )
    
    if result.modified_count > 0:
        print("[SUCCESS] User role updated to 'admin'.")
    elif result.matched_count > 0:
        print("[INFO] User found but role was already 'admin'.")
    else:
        print("[ERROR] Admin user not found.")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(update_admin_role())
