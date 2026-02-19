# Small Business Inventory Prediction Web Application

This is a lightweight inventory management system designed for small shops. It includes a FastAPI backend, a MongoDB database, and a modern vanilla JavaScript frontend.

## Features
- **Dashboard**: High-level overview of total products, low stock alerts, and stock level charts.
- **Product Management**: Full CRUD (Create, Read, Update, Delete) for managing a shop's inventory.
- **Sales Tracking**: Record daily sales to maintain accurate stock levels.
- **Inventory Prediction**: Suggests stock needs for the next 7 days based on a 30-day moving average of sales.
- **Premium Design**: Modern dark mode interface with glassmorphism and responsive layout.

## Prerequisites
- **Python 3.8+**
- **MongoDB** (Running locally on `mongodb://localhost:27017` or as specified in `.env`)
- **Node.js** (Optional, for serving frontend)

## Installation & Setup

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. **Environment Variables**:
   Create a `.env` file in the `backend` folder:
   ```env
   MONGODB_URL=mongodb://localhost:27017
   ```
3. **Run the Backend**:
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8005`.

4. **Frontend**:
   Simply open `frontend/index.html` in your web browser. Or use a local server like `Live Server` in VS Code.

## Usage
1. Go to the **Products** tab and add some items to your inventory.
2. Go to the **New Sale** tab and record some transactions.
3. Check the **Predictions** tab to see your suggested stock needs for the next week.
4. Monitor the **Dashboard** for low-stock alerts.
