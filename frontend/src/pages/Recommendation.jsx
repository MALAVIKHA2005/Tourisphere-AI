import React from "react";
import RecommendationForm from "../components/RecommendationForm";

const Recommendation = () => {
  return (
    <div className="p-8">
      <p className="text-orange-500 uppercase tracking-wider">
        AI Recommendation Engine
      </p>

      <h1 className="text-5xl font-bold mt-3 mb-4">
        Smart Destination Recommendations
      </h1>

      <p className="text-gray-500 mb-8">
        Get personalized travel recommendations based on budget,
        interests and destination preferences.
      </p>

      <RecommendationForm />
    </div>
  );
};

export default Recommendation;