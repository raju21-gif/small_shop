import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta

class StockPredictor:
    def __init__(self):
        self.model = LinearRegression()

    def predict_future_demand(self, sales_history, days_to_predict=7):
        """
        Predicts total demand for the next `days_to_predict` days based on daily sales history.
        
        :param sales_history: List of dictionaries [{'date': datetime, 'quantity': int}, ...]
        :param days_to_predict: Number of future days to forecast
        :return: Integer prediction of total units needed
        """
        if not sales_history or len(sales_history) < 2:
            return 0  # Not enough data for regression

        # Convert to DataFrame
        df = pd.DataFrame(sales_history)
        df['date'] = pd.to_datetime(df['date'])
        
        # Calculate days from start (integer X for regression)
        start_date = df['date'].min()
        df['day_index'] = (df['date'] - start_date).dt.days
        
        # Group by day index in case multiple entries exist for same day
        daily_sales = df.groupby('day_index')['quantity'].sum().reset_index()

        # Prepare X and y
        X = daily_sales[['day_index']].values
        y = daily_sales['quantity'].values

        # Train Model
        self.model.fit(X, y)

        # Predict future dates
        last_day_index = daily_sales['day_index'].max()
        future_X = np.array([[last_day_index + i] for i in range(1, days_to_predict + 1)])
        
        predictions = self.model.predict(future_X)
        
        # Sum up predicted daily sales, ensure non-negative
        total_predicted_demand = sum([max(0, p) for p in predictions])
        
        return int(round(total_predicted_demand))

# Simple test
if __name__ == "__main__":
    predictor = StockPredictor()
    # Mock data: Increasing trend
    data = [
        {'date': datetime(2023, 10, 1), 'quantity': 5},
        {'date': datetime(2023, 10, 2), 'quantity': 6},
        {'date': datetime(2023, 10, 3), 'quantity': 7},
        {'date': datetime(2023, 10, 4), 'quantity': 8},
        {'date': datetime(2023, 10, 5), 'quantity': 10},
    ]
    print(f"Predicted need: {predictor.predict_future_demand(data)}")
