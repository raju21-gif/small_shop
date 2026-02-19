from pydantic import BaseModel, Field, ConfigDict, GetCoreSchemaHandler
from pydantic.json_schema import GetJsonSchemaHandler
from pydantic_core import core_schema
from typing import Optional, List, Any, Dict
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ]),
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x), when_used='json'
            ),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(
        cls, core_schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> Dict[str, Any]:
        json_schema = handler(core_schema)
        json_schema.update(type="string")
        return json_schema

class ProductModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", serialization_alias="_id", default=None)
    name: str = Field(...)
    category: str = Field(...)
    price: float = Field(..., gt=0)
    current_stock: int = Field(..., ge=0)
    low_stock_threshold: int = Field(default=10, ge=0)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "name": "Milk",
                "category": "Dairy",
                "price": 25.0,
                "current_stock": 50,
                "low_stock_threshold": 10
            }
        },
    )

class ProductUpdateModel(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    current_stock: Optional[int] = None
    low_stock_threshold: Optional[int] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class SaleModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", serialization_alias="_id", default=None)
    product_id: str = Field(...)
    product_name: Optional[str] = None
    quantity_sold: int = Field(..., gt=0)
    unit_price: Optional[float] = None
    total_price: Optional[float] = None
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    status: str = Field(default="pending") # pending, approved, cancelled
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class UserModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", serialization_alias="_id", default=None)
    username: str = Field(...)
    email: str = Field(...)
    image_url: Optional[str] = None
    role: str = Field(default="staff") # admin or staff
    hashed_password: str = Field(...)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class UserCreate(BaseModel):
    username: str = Field(...)
    email: str = Field(...)
    password: str = Field(...)
    confirm_password: str = Field(...)
    image_url: Optional[str] = None
    role: str = Field(default="staff")

class StockModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", serialization_alias="_id", default=None)
    product_name: str = Field(...)
    category: str = Field(...)
    quantity: int = Field(..., ge=0)
    price: float = Field(..., gt=0)
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "product_name": "Apples",
                "category": "Fruits",
                "quantity": 100,
                "price": 45.0
            }
        },
    )

class Token(BaseModel):
    access_token: str
    token_type: str
