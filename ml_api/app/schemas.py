from pydantic import BaseModel
from typing import List, Optional


class PredictionInput(BaseModel):
    Inventory_Level: float
    Units_Sold: int
    Units_Ordered: int
    Discount: float
    Competitor_Pricing: float
    Sales_Rate: float
    Order_Fulfillment_Rate: float
    Promotion: int  # 0 ou 1
    Epidemic: int  # 0 ou 1
    Category: str  # "Electronics", "Furniture", "Groceries", "Toys"
    Region: str  # "North", "South", "West"
    Weather_Condition: str  # "Sunny", "Rainy", "Snowy"
    Seasonality: str  # "Spring", "Summer", "Winter"


class PredictionOutput(BaseModel):
    prediction: float
    status: str = "success"


class ErrorOutput(BaseModel):
    detail: str
    status: str = "error"