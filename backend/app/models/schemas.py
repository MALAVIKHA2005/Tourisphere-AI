from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class SearchHistoryCreate(BaseModel):
    country: Optional[str] = None
    state: Optional[str] = None
    budget: Optional[str] = None
    climate: Optional[str] = None
    interest: Optional[str] = None
    travel_type: Optional[str] = None
    month: Optional[str] = None
    query: Optional[str] = None
    result_count: int = 0
