import React, { useState } from "react";
import { register } from "../services/authService";

export default function Register({ onSuccess, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await register(name, email, password);
      onSuccess(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-6">Create Account</h2>

        {error && (
          <p className="bg-red-100 text-red-700 text-sm p-3 rounded-lg mb-4">
            {error}
          </p>
        )}

        <label className="block text-sm text-gray-500 mb-1">Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4"
        />

        <label className="block text-sm text-gray-500 mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4"
        />

        <label className="block text-sm text-gray-500 mb-1">Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-3 rounded-lg mb-1"
        />
        <p className="text-xs text-gray-400 mb-6">At least 8 characters.</p>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-black font-semibold hover:underline"
          >
            Sign in
          </button>
        </p>
      </form>
    </div>
  );
}
