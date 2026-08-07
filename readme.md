# 🌍 Tourisphere AI

> **AI-Powered Global Travel Intelligence Platform**

Tourisphere AI is an AI-powered travel intelligence platform designed to deliver personalized travel experiences through Artificial Intelligence, Machine Learning, Data Analytics, and intelligent recommendation systems.

The goal of this platform is to evolve into a complete travel ecosystem that assists users in discovering destinations, planning trips, analyzing travel preferences, forecasting tourism trends, and providing AI-powered travel assistance.

> 🚧 **Project Status:** This project is currently under active development.

## 🔗 Live Demo

- **App:** https://tourisphere-ai-maals.vercel.app
- **API:** https://tourisphere-ai.onrender.com

Live hotel pricing is powered by [Xotelo](https://xotelo.com/) via RapidAPI (Amadeus's self-service developer program was decommissioned in July 2026).

---

# 🚀 Current Progress

## ✅ Completed

- Foundation Setup
- Dynamic Destination Recommendation
- Dynamic Destination Images
- Live Weather Integration
- User Analytics, Travel History & Personalized Dashboard
- Authentication (JWT, guest-to-account data merge)
- Production hardening (secrets, caching, CORS/cookie config, privacy controls)
- Nearby Restaurant Recommendations (Geoapify-powered, per destination)
- Hotel Search with real live pricing per provider (Xotelo-powered, per destination)
- Popular Dishes per country (curated reference data) on destination cards
- Getting There: real road distance/time between any two places (Geoapify routing), per destination -- flights/trains/buses have no honest free data source, so this covers road trips only
- Lifestyle: real Shopping, Nightlife, Entertainment & Culture spots nearby (Geoapify-powered, per destination)
- Education: real Universities, Colleges & Schools nearby (Geoapify-powered, per destination) -- course catalogues and tuition costs skipped, no free source exists
- Popularity: real Wikipedia monthly page views per destination (no honest free per-city Safety Score exists anywhere, so it was removed rather than faked; Family Score replaced with a real count of nearby parks/playgrounds/zoos)
- Best Months: derived from real historical climate data (Open-Meteo, 3 years of daily temperature/rainfall per destination) instead of a curator's guess or a flat Oct/Nov/Dec on every live-searched result
- Essential Services: real Healthcare, Supermarkets, Banking & Public Transport nearby (Geoapify-powered, per destination) -- housing/real-estate prices, cost of living index and job market data all have no honest free source, so Phase 12 covers this instead
- AI Recommendation Engine: content-based similarity ("You Might Also Like" on every destination, "Recommended For You" from real favorites/travel history) using shared interests, climate, budget and country -- a transparent, documented formula over real stored attributes, not a trained model and not a fake score
- Interest Trend Forecasting: no free source exists for real tourist-arrival numbers, so this uses real multi-year Wikipedia search-interest history per destination (median year-over-year growth) projected 3 months forward -- explicitly labeled as a search-interest proxy, not a visitor forecast. Required tracking down and working around three separate real bugs/quirks in Wikimedia's own pageviews API (a multi-year span that 404s even though each year alone works; December's monthly total silently reporting only day 1's count; occasional huge single-day traffic spikes, verified as real recorded data rather than corruption). Now has its own page (sidebar "Forecasting", previously a dead button) with a destination picker
- User Segmentation: not enough real users yet for clustering to mean anything, so each user's real profile (from their real favorites/travel history, reusing the recommendation engine's own similarity formula) is matched against a small set of named travel personas grounded in the catalogue's real interest/climate/budget vocabulary -- transparent rule-based classification, not a trained model, and honestly empty for users with no engagement yet. Sidebar "Segmentation" button (previously dead) now opens this
- Traveler Reviews (destinations): signed-in users can leave a real 1-5 star rating + written review per destination (editable, one per user), shown on every destination's detail view with a live average rating
- Sentiment Analysis: every real review's text is scored with VADER (a lexicon + rule-based sentiment analyzer, not a trained model -- no labeled training data exists for travel reviews here), computed once when the review is saved. Each review shows its own sentiment badge; a destination-level breakdown (Positive/Neutral/Negative, with "Mixed" for genuine ties rather than an arbitrary pick) lives on its own page (sidebar "Sentiment", previously a dead placeholder), honestly empty for destinations with no reviews yet

---

# 🛣️ Development Roadmap

| Phase | Module | Status |
|--------|-------------------------------|---------|
| Phase 1 | Foundation | ✅ Completed |
| Phase 2 | Dynamic Destinations | ✅ Completed |
| Phase 3 | Dynamic Images | ✅ Completed |
| Phase 4 | Live Weather | ✅ Completed |
| Phase 5 | User Analytics & Travel History | ✅ Completed |
| Phase 6 | Authentication | ✅ Completed |
| Phase 7 | Food & Restaurant | ✅ Completed |
| Phase 8 | Hotels | ✅ Completed |
| Phase 9 | Transport (road routes only -- no free flight/train/bus fare data exists) | ✅ Completed |
| Phase 10 | Lifestyle (Shopping, Nightlife, Entertainment, Culture -- Events skipped, no free source) | ✅ Completed |
| Phase 11 | Education (Universities, Colleges, Schools -- Courses & Education Costs skipped, no free source) | ✅ Completed |
| Phase 12 | Relocation (Essential Services -- Housing/Cost of Living/Jobs skipped, no free source) | ✅ Completed |
| Phase 13 | AI Recommendation Engine (content-based similarity -- no training data needed) | ✅ Completed |
| Phase 14 | Forecasting (real Wikipedia search-interest trend, not visitor-count data -- none exists free) | ✅ Completed |
| Phase 15 | User Segmentation (rule-based persona classification from real engagement -- not enough real users yet for clustering) | ✅ Completed |
| Phase 16 | Sentiment Analysis (real reviews scored with VADER, lexicon-based -- no training data exists to train a model) | ✅ Completed |
| Phase 17 | RAG AI Assistant | ⏳ Planned |
| Phase 18 | AI Trip Planner | ⏳ Planned |
| Phase 19 | Booking System | ⏳ Planned |
| Phase 20 | Expense Tracker | ⏳ Planned |
| Phase 21 | Government Tourism Analytics Dashboard | ⏳ Planned |
| Phase 22 | Cloud Deployment | ⏳ Planned |

---

# ✨ Current Features

- 🌍 Global Destination Recommendation
- 🔎 Intelligent Search & Filtering
- 📸 Dynamic Destination Images
- 🌦️ Live Weather Information
- 🎯 Preference-Based Recommendations
- 📱 Responsive User Interface

---

# 🤖 AI, Machine Learning & Data Science

## Artificial Intelligence
- Intelligent Travel Recommendation
- AI-assisted Travel Planning *(Planned)*

## Machine Learning
- Personalized Recommendation System
- User Behaviour Analytics
- Predictive Analytics *(Planned)*

## Deep Learning *(Future Scope)*
- Deep Learning-based Recommendation Models
- Intelligent Preference Learning

## Data Science & Analytics
- User Analytics
- Travel Analytics
- Tourism Data Analysis
- Data Visualization

## Advanced AI
- Forecasting
- User Segmentation
- Sentiment Analysis
- Retrieval-Augmented Generation (RAG) *(Planned)*
- Large Language Model (LLM) Integration *(Planned)*

---

# 🛠️ Technology Stack

## Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Tailwind CSS

## Backend
- Python
- FastAPI
- REST APIs

## Database
- MongoDB

## APIs
- Weather API
- Image API

## Development Tools
- Git
- GitHub
- VS Code

---

# 📂 Project Structure

```
Tourisphere-AI
│
├── frontend/
├── backend/
│   ├── app/
│   ├── database/
│   ├── routes/
│   ├── services/
│   └── main.py
│
└── README.md
```

---

# 🎯 Vision

To build a scalable AI-powered travel platform that combines recommendation systems, predictive analytics, user behaviour analysis, intelligent planning, and tourism intelligence into one unified ecosystem.

---

# 🔮 Future Enhancements

- AI Trip Planner
- Intelligent Itinerary Generation
- Government Tourism Analytics Dashboard
- Booking System
- Expense Tracking
- Multi-language Support
- RAG AI Assistant

---

# ⚙️ Installation

### Clone the Repository

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/Tourisphere-AI.git
```

### Environment Variables

Both `frontend/` and `backend/` have a `.env.example`. Copy each to `.env`
in the same folder and fill in your own values (MongoDB URI, API keys for
Geoapify/Pexels/OpenWeatherMap/Amadeus, a random JWT secret). Never commit
the real `.env` files.

### Frontend

```bash
cd frontend
npm install
npm start
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

# 🤝 Contributing

Contributions, ideas, bug reports, and feature suggestions are welcome.

If you'd like to contribute, please fork the repository and submit a pull request.

---

# 👩‍💻 Developer

**Malavikha G**

M.Sc. Data Science

Passionate about Artificial Intelligence, Machine Learning, Data Science, and Intelligent Software Products.

---

# ⭐ Support

If you find this project useful, consider giving it a ⭐ on GitHub.

It motivates continued development and future enhancements.

---

# 📌 Project Status

🚧 **This repository is under active development.**

New features and AI modules are continuously being added as part of the product roadmap.