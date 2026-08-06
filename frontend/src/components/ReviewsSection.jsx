import React, { useEffect, useState } from "react";
import { fetchMe } from "../services/authService";
import { deleteReview, fetchReviews, submitReview } from "../services/reviewService";
import { getDestinationKey } from "../utils/destinationKey";

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className={`text-2xl leading-none transition-colors ${
          n <= value ? "text-amber-400" : "text-gray-300 hover:text-amber-200"
        }`}
        aria-label={`${n} star${n > 1 ? "s" : ""}`}
      >
        ★
      </button>
    ))}
  </div>
);

const Stars = ({ rating }) => (
  <span className="text-amber-400 tracking-tight">
    {"★".repeat(rating)}
    <span className="text-gray-300">{"★".repeat(5 - rating)}</span>
  </span>
);

const ReviewsSection = ({ destination }) => {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [count, setCount] = useState(0);
  const [averageRating, setAverageRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);

    const [me, data] = await Promise.all([
      fetchMe(),
      fetchReviews(destination),
    ]);

    setUser(me);
    setReviews(data.reviews || []);
    setCount(data.count || 0);
    setAverageRating(data.averageRating);

    const mine = me && data.reviews.find((r) => r.user_id === me.id);
    setRating(mine?.rating || 0);
    setText(mine?.text || "");

    setLoading(false);
  };

  useEffect(() => {
    if (!destination) return;
    setError("");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination && getDestinationKey(destination)]);

  const myReview = user && reviews.find((r) => r.user_id === user.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (rating < 1) {
      setError("Pick a star rating before submitting.");
      return;
    }

    if (!text.trim()) {
      setError("Write a few words before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      await submitReview(destination, rating, text.trim());
      await load();
    } catch (err) {
      setError(err.message || "Couldn't save your review.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    setError("");

    try {
      await deleteReview(destination);
      setRating(0);
      setText("");
      await load();
    } catch (err) {
      setError(err.message || "Couldn't delete your review.");
    } finally {
      setSubmitting(false);
    }
  };

  const otherReviews = reviews.filter((r) => !user || r.user_id !== user.id);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">📝 Traveler Reviews</h3>

        {averageRating !== null && (
          <span className="text-sm font-semibold text-gray-600">
            <Stars rating={Math.round(averageRating)} /> {averageRating} ({count})
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading reviews...</p>
      ) : (
        <>
          {user ? (
            <form
              onSubmit={handleSubmit}
              className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3"
            >
              <p className="text-xs uppercase tracking-wide text-gray-400">
                {myReview ? "Edit your review" : "Leave a review"}
              </p>

              <StarPicker value={rating} onChange={setRating} />

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="What was your experience like?"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all resize-none"
              />

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {myReview ? "Update Review" : "Post Review"}
                </button>

                {myReview && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={submitting}
                    className="text-sm text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              Sign in to leave a review for this destination.
            </p>
          )}

          {otherReviews.length === 0 && !myReview && (
            <p className="text-sm text-gray-500">No reviews yet -- be the first to write one.</p>
          )}

          <div className="space-y-3">
            {[...(myReview ? [myReview] : []), ...otherReviews].map((r) => (
              <div key={r.user_id} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">
                    {r.user_name}
                    {user && r.user_id === user.id && (
                      <span className="text-xs text-orange-500 font-normal ml-2">(You)</span>
                    )}
                  </p>
                  <Stars rating={r.rating} />
                </div>

                <p className="text-sm text-gray-700 mt-1">{r.text}</p>

                <p className="text-xs text-gray-400 mt-1">
                  {new Date(r.updated_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewsSection;
