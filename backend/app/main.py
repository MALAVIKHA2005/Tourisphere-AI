import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.mongodb import db
from app.routes.search import router as search_router
from app.routes.recommendations import router as recommendations_router
from app.routes.favorites import router as favorites_router
from app.routes.history import router as history_router
from app.routes.search_history import router as search_history_router
from app.routes.analytics import router as analytics_router
from app.routes.hotel_price import router as hotel_price_router
from app.routes.auth import router as auth_router
from app.routes.platform_analytics import router as platform_analytics_router
from app.routes.weather import router as weather_router
from app.routes.currency import router as currency_router
from app.routes.countries import router as countries_router
from app.routes.restaurants import router as restaurants_router
from app.routes.dishes import router as dishes_router
from app.routes.transport import router as transport_router
from app.routes.lifestyle import router as lifestyle_router
from app.routes.states import router as states_router
from app.routes.education import router as education_router
from app.routes.essential_services import router as essential_services_router
from app.routes.recommendation_engine import router as recommendation_engine_router
from app.routes.forecast import router as forecast_router
from app.routes.segmentation import router as segmentation_router
from app.routes.reviews import router as reviews_router
from app.routes.sentiment import router as sentiment_router
from app.routes.rag import router as rag_router
from app.routes.trip_planner import router as trip_planner_router
from app.routes.destinations import (
    router as destinations_router
)

load_dotenv()

app = FastAPI(
    title="Travel Recommendation API"
)

# Enable CORS
# Note: a wildcard origin ("*") is not allowed together with
# allow_credentials=True -- browsers refuse to expose the response, which
# breaks the httpOnly auth cookie. Origins must be listed explicitly, and
# in production FRONTEND_ORIGINS should be set to the real deployed domain.
FRONTEND_ORIGINS = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    destinations_router
)
app.include_router(search_router)
app.include_router(recommendations_router)
app.include_router(favorites_router)
app.include_router(history_router)
app.include_router(search_history_router)
app.include_router(analytics_router)
app.include_router(hotel_price_router)
app.include_router(auth_router)
app.include_router(platform_analytics_router)
app.include_router(weather_router)
app.include_router(currency_router)
app.include_router(countries_router)
app.include_router(restaurants_router)
app.include_router(dishes_router)
app.include_router(transport_router)
app.include_router(lifestyle_router)
app.include_router(states_router)
app.include_router(education_router)
app.include_router(essential_services_router)
app.include_router(recommendation_engine_router)
app.include_router(forecast_router)
app.include_router(segmentation_router)
app.include_router(reviews_router)
app.include_router(sentiment_router)
app.include_router(rag_router)
app.include_router(trip_planner_router)
@app.get("/")
def root():
    return {
        "message":
        "Travel Recommendation Backend Running"
    }
