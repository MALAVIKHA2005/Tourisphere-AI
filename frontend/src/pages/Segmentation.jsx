import React, { useEffect, useState } from "react";
import { fetchUserSegment } from "../services/segmentationService";

export default function Segmentation() {
  const [segment, setSegment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserSegment()
      .then(setSegment)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <div className="flex-1 p-12 overflow-auto">

        <p className="text-orange-500 tracking-widest text-sm">
          PHASE 15 • USER SEGMENTATION
        </p>

        <h1 className="text-5xl font-bold mt-2">Your Travel Persona</h1>

        <p className="text-gray-500 mt-4 mb-10 max-w-2xl">
          Classified from your real favorites and travel history against a
          small set of named personas -- not a trained model. There isn't
          nearly enough real user data yet for clustering to mean anything,
          so this is transparent rule-based matching, using the exact same
          similarity formula behind "You Might Also Like."
        </p>

        {loading && <p className="text-gray-500">Loading...</p>}

        {!loading && !segment?.available && (
          <div className="bg-white rounded-2xl shadow-sm p-8 max-w-2xl">
            <h2 className="text-xl font-bold mb-2">Not enough data yet</h2>
            <p className="text-gray-500">
              You haven't favorited or viewed any destinations yet, so there's
              nothing real to classify. Go explore a few destinations and add
              some favorites -- your persona will appear here once you have.
            </p>
          </div>
        )}

        {!loading && segment?.available && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl shadow-sm p-8 border-t-4 border-t-orange-400">
              <p className="text-gray-400 uppercase text-xs tracking-wide">
                Your Persona
              </p>

              <div className="flex items-center justify-between mt-1 mb-3">
                <h2 className="text-3xl font-bold">{segment.segment}</h2>
                <span className="text-sm font-bold text-orange-600 whitespace-nowrap ml-3">
                  {segment.matchScore}% match
                </span>
              </div>

              <p className="text-gray-600 mb-4">{segment.description}</p>

              {segment.matchReasons?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {segment.matchReasons.map((reason) => (
                    <span
                      key={reason}
                      className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}

              <div className="border-t pt-4 mt-2">
                <p className="text-gray-400 uppercase text-xs tracking-wide mb-3">
                  Real signals behind this
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Top Interests
                    </p>
                    <p className="font-semibold">
                      {segment.realSignals.topInterests?.join(", ") || "No data"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Dominant Climate
                    </p>
                    <p className="font-semibold">
                      {segment.realSignals.dominantClimate || "No data"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Dominant Budget
                    </p>
                    <p className="font-semibold">
                      {segment.realSignals.dominantBudget || "No data"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
