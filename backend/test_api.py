import requests
import asyncio

API_URL = "http://localhost:8080"

def test_users():
    # 1. Login
    print("Logging in...")
    resp = requests.post(f"{API_URL}/token", data={"username": "admin@shopmanager.com", "password": "admin123"})
    if resp.status_code != 200:
        print("Login failed:", resp.text)
        return
    
    token = resp.json()["access_token"]
    print("Logged in. Token acquired.")

    # 2. Get Users
    print("\nFetching users...")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{API_URL}/users", headers=headers)
    
    if resp.status_code == 200:
        users = resp.json()
        print(f"Success! Found {len(users)} users.")
        print("-" * 20)
        for u in users:
            print(u)
    else:
        print("Failed to fetch users:", resp.status_code, resp.text)

if __name__ == "__main__":
    test_users()
