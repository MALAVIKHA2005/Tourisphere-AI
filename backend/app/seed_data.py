from app.database.mongodb import db
from app.services.image_service import get_place_image

print("Connected to MongoDB")

# Optional: Clear old data
db.destinations.delete_many({})

# No hardcoded averageCost here -- these were rough hand-picked guesses
# that ended up colliding across unrelated destinations (e.g. Agra,
# Kodaikanal and Delhi were all exactly 500). The real, live price
# (Xotelo-powered) is fetched on demand in the modal instead.
destinations = [
    {
        "id": 1,
        "name": "Ooty",
        "city": "Ooty",
        "country": "India",
        "state": "Tamil Nadu",
        "interests": ["Nature", "Hill Station", "Photography"],
        "suitableFor": ["Family", "Couple", "Friends"],
        "budget": "Medium",
        "bestMonths": ["March", "April", "May", "June"],
        "climate": "Cool",
        "rating": 4.8,
        "popularity": 87,
        "safetyScore": 92,
        "familyScore": 95,
        "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
    },

    {
        "id": 2,
        "name": "Kodaikanal",
        "city": "Kodaikanal",
        "country": "India",
        "state": "Tamil Nadu",
        "interests": ["Nature", "Hill Station", "Adventure"],
        "suitableFor": ["Family", "Couple", "Friends"],
        "budget": "Medium",
        "bestMonths": ["April", "May", "June"],
        "climate": "Cool",
        "rating": 4.8,
        "popularity": 84,
        "safetyScore": 91,
        "familyScore": 94,
        "image": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"
    },

    {
        "id": 3,
        "name": "Goa",
        "city": "Goa",
        "country": "India",
        "state": "Goa",
        "interests": ["Beach", "Adventure", "Nightlife"],
        "suitableFor": ["Solo", "Couple", "Friends", "Family"],
        "budget": "Medium",
        "bestMonths": ["November", "December", "January", "February"],
        "climate": "Tropical",
        "rating": 4.7,
        "popularity": 95,
        "safetyScore": 82,
        "familyScore": 88,
        "image": "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86"
    },

    {
        "id": 4,
        "name": "Munnar",
        "city": "Munnar",
        "country": "India",
        "state": "Kerala",
        "interests": ["Nature", "Photography", "Hill Station"],
        "suitableFor": ["Family", "Couple"],
        "budget": "Medium",
        "bestMonths": ["September", "October", "November", "December"],
        "climate": "Cool",
        "rating": 4.8,
        "popularity": 88,
        "safetyScore": 94,
        "familyScore": 96,
        "image": "https://images.unsplash.com/photo-1501785888041-af3ef285b470"
    },

    {
        "id": 5,
        "name": "Maldives",
        "city": "Maldives",
        "country": "Maldives",
        "state": "Male",
        "interests": ["Beach", "Luxury", "Photography"],
        "suitableFor": ["Couple", "Family"],
        "budget": "High",
        "bestMonths": ["November", "December", "January", "February", "March"],
        "climate": "Tropical",
        "rating": 4.9,
        "popularity": 99,
        "safetyScore": 95,
        "familyScore": 90,
        "image": "https://images.unsplash.com/photo-1573843981267-be1999ff37cd"
    },

    {
        "id": 6,
        "name": "Bali",
        "city": "Bali",
        "country": "Indonesia",
        "state": "Bali",
        "interests": ["Beach", "Culture", "Adventure"],
        "suitableFor": ["Solo", "Couple", "Friends"],
        "budget": "Medium",
        "bestMonths": ["April", "May", "June", "July", "August"],
        "climate": "Tropical",
        "rating": 4.8,
        "popularity": 94,
        "safetyScore": 89,
        "familyScore": 86,
        "image": "https://images.unsplash.com/photo-1537996194471-e657df975ab4"
    },

    {
        "id": 7,
        "name": "Kyoto",
        "city": "Kyoto",
        "country": "Japan",
        "state": "Kyoto",
        "interests": ["Culture", "History", "Photography"],
        "suitableFor": ["Solo", "Couple", "Family"],
        "budget": "Medium",
        "bestMonths": ["March", "April", "October", "November"],
        "climate": "Cool",
        "rating": 4.9,
        "popularity": 92,
        "safetyScore": 98,
        "familyScore": 91,
        "image": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e"
    },

    {
        "id": 8,
        "name": "Paris",
        "city": "Paris",
        "country": "France",
        "state": "Paris",
        "interests": ["Culture", "Luxury", "Photography"],
        "suitableFor": ["Couple", "Family"],
        "budget": "High",
        "bestMonths": ["April", "May", "June", "September"],
        "climate": "Warm",
        "rating": 4.8,
        "popularity": 96,
        "safetyScore": 87,
        "familyScore": 85,
        "image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34"
    }
]

popular_destinations = [
    {
        "id": 9, "name": "Agra", "city": "Agra", "country": "India", "state": "Uttar Pradesh",
        "interests": ["Culture", "Photography"], "suitableFor": ["Family", "Couple", "Solo", "Friends"],
        "budget": "Medium", "bestMonths": ["October", "November", "December", "January", "February", "March"],
        "climate": "Warm", "rating": 4.9, "popularity": 98, "safetyScore": 80, "familyScore": 88,
    },
    {
        "id": 10, "name": "Jaipur", "city": "Jaipur", "country": "India", "state": "Rajasthan",
        "interests": ["Culture", "Photography"], "suitableFor": ["Family", "Couple", "Friends"],
        "budget": "Medium", "bestMonths": ["October", "November", "December", "January", "February"],
        "climate": "Warm", "rating": 4.7, "popularity": 90, "safetyScore": 82, "familyScore": 87,
    },
    {
        "id": 11, "name": "Delhi", "city": "Delhi", "country": "India", "state": "Delhi",
        "interests": ["Culture", "Photography"], "suitableFor": ["Solo", "Couple", "Family", "Friends"],
        "budget": "Medium", "bestMonths": ["October", "November", "February", "March"],
        "climate": "Warm", "rating": 4.3, "popularity": 85, "safetyScore": 75, "familyScore": 78,
    },
    {
        "id": 12, "name": "Udaipur", "city": "Udaipur", "country": "India", "state": "Rajasthan",
        "interests": ["Culture", "Luxury", "Photography"], "suitableFor": ["Couple", "Family"],
        "budget": "High", "bestMonths": ["September", "October", "November", "December", "January", "February"],
        "climate": "Warm", "rating": 4.8, "popularity": 86, "safetyScore": 88, "familyScore": 90,
    },
    {
        "id": 13, "name": "Mumbai", "city": "Mumbai", "country": "India", "state": "Maharashtra",
        "interests": ["Culture"], "suitableFor": ["Solo", "Couple", "Friends", "Family"],
        "budget": "Medium", "bestMonths": ["November", "December", "January", "February"],
        "climate": "Warm", "rating": 4.3, "popularity": 84, "safetyScore": 78, "familyScore": 80,
    },
    {
        "id": 14, "name": "Rome", "city": "Rome", "country": "Italy", "state": "Lazio",
        "interests": ["Culture", "Photography"], "suitableFor": ["Couple", "Family", "Solo"],
        "budget": "High", "bestMonths": ["April", "May", "September", "October"],
        "climate": "Warm", "rating": 4.8, "popularity": 95, "safetyScore": 85, "familyScore": 88,
    },
    {
        "id": 15, "name": "London", "city": "London", "country": "United Kingdom", "state": "England",
        "interests": ["Culture", "Luxury"], "suitableFor": ["Couple", "Family", "Solo", "Friends"],
        "budget": "High", "bestMonths": ["May", "June", "July", "September"],
        "climate": "Cool", "rating": 4.7, "popularity": 93, "safetyScore": 88, "familyScore": 87,
    },
    {
        "id": 16, "name": "New York", "city": "New York", "country": "United States", "state": "New York",
        "interests": ["Culture", "Luxury", "Adventure"], "suitableFor": ["Couple", "Family", "Solo", "Friends"],
        "budget": "High", "bestMonths": ["April", "May", "September", "October"],
        "climate": "Cool", "rating": 4.7, "popularity": 96, "safetyScore": 80, "familyScore": 82,
    },
    {
        "id": 17, "name": "Dubai", "city": "Dubai", "country": "United Arab Emirates", "state": "Dubai",
        "interests": ["Luxury", "Adventure", "Photography"], "suitableFor": ["Couple", "Family", "Friends"],
        "budget": "High", "bestMonths": ["November", "December", "January", "February", "March"],
        "climate": "Warm", "rating": 4.7, "popularity": 94, "safetyScore": 92, "familyScore": 90,
    },
    {
        "id": 18, "name": "Singapore", "city": "Singapore", "country": "Singapore", "state": "Singapore",
        "interests": ["Culture", "Luxury", "Adventure"], "suitableFor": ["Couple", "Family", "Friends", "Solo"],
        "budget": "High", "bestMonths": ["February", "March", "April"],
        "climate": "Tropical", "rating": 4.8, "popularity": 92, "safetyScore": 96, "familyScore": 93,
    },
    {
        "id": 19, "name": "Bangkok", "city": "Bangkok", "country": "Thailand", "state": "Bangkok",
        "interests": ["Culture", "Adventure"], "suitableFor": ["Solo", "Couple", "Friends"],
        "budget": "Low", "bestMonths": ["November", "December", "January", "February"],
        "climate": "Tropical", "rating": 4.5, "popularity": 89, "safetyScore": 75, "familyScore": 76,
    },
    {
        "id": 20, "name": "Santorini", "city": "Santorini", "country": "Greece", "state": "South Aegean",
        "interests": ["Beach", "Luxury", "Photography"], "suitableFor": ["Couple"],
        "budget": "High", "bestMonths": ["May", "June", "September"],
        "climate": "Warm", "rating": 4.9, "popularity": 91, "safetyScore": 90, "familyScore": 80,
    },
    {
        "id": 21, "name": "Sydney", "city": "Sydney", "country": "Australia", "state": "New South Wales",
        "interests": ["Beach", "Nature", "Adventure"], "suitableFor": ["Family", "Couple", "Friends", "Solo"],
        "budget": "High", "bestMonths": ["September", "October", "November", "March"],
        "climate": "Warm", "rating": 4.7, "popularity": 90, "safetyScore": 90, "familyScore": 88,
    },
    {
        "id": 22, "name": "Zurich", "city": "Zurich", "country": "Switzerland", "state": "Zurich",
        "interests": ["Nature", "Hill Station", "Luxury", "Photography"], "suitableFor": ["Couple", "Family"],
        "budget": "High", "bestMonths": ["June", "July", "August", "December"],
        "climate": "Cool", "rating": 4.9, "popularity": 88, "safetyScore": 97, "familyScore": 92,
    },
    {
        # OpenStreetMap doesn't tag this (or most spiritual/meditation
        # sites) as a "tourism" attraction, so it never surfaces via the
        # live dynamic search -- added here, in the curated catalogue,
        # so it reliably appears for India/Tamil Nadu/Coimbatore searches
        # instead of depending on OSM tagging that doesn't exist.
        "id": 23, "name": "Isha Yoga Center (Adiyogi Statue)", "city": "Coimbatore", "country": "India", "state": "Tamil Nadu",
        "interests": ["Culture", "Nature"], "suitableFor": ["Solo", "Couple", "Family", "Friends"],
        "budget": "Low", "bestMonths": ["October", "November", "December", "January", "February"],
        "climate": "Warm", "rating": 4.8, "popularity": 92, "safetyScore": 90, "familyScore": 85,
    },
]

for destination in popular_destinations:
    destination["image"] = get_place_image(
        f"{destination['name']} tourist attraction {destination['country']}"
    )

destinations.extend(popular_destinations)

db.destinations.insert_many(destinations)

print(f"{len(destinations)} Destinations Inserted Successfully")
