from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

uri = os.getenv("MONGO_URI")

print("URI Loaded:", uri[:35] + "...")

try:
    client = MongoClient(uri, serverSelectionTimeoutMS=10000)
    print(client.server_info())
    print("MongoDB Connected Successfully!")
except Exception as e:
    print("Connection Failed")
    print(type(e))
    print(e)