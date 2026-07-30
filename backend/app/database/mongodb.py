from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI, tz_aware=True)

db = client["travel_recommendation"]

destinations_collection = db["destinations"]

favorites_collection = db["favorites"]

travel_history_collection = db["travel_history"]

users_collection = db["users"]

bookings_collection = db["bookings"]

payments_collection = db["payments"]

reviews_collection = db["reviews"]

trip_plans_collection = db["trip_plans"]

search_history_collection = db["search_history"]

try:
    users_collection.create_index("email", unique=True)
    print("MongoDB Connected Successfully")
except Exception as e:
    # Don't let a transient DB outage at startup crash the whole app --
    # routes that actually touch the DB will still fail individually,
    # but the process stays up and can recover once Mongo is reachable.
    print("MongoDB Connection Warning (startup):", e)