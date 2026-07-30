import React from "react";

export default function Privacy() {
  return (
    <div className="flex-1 p-12 max-w-3xl overflow-auto">
      <h1 className="text-4xl font-bold mb-6">Privacy Notice</h1>

      <p className="text-gray-500 mb-8">
        This is a plain-language summary of what Tourisphere collects and
        why. It is not a substitute for formal legal advice.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">What we collect</h2>
      <ul className="list-disc pl-6 text-gray-700 space-y-1">
        <li>
          <strong>If you create an account:</strong> your name, email
          address, and a securely hashed password (we never store your
          actual password).
        </li>
        <li>
          <strong>If you don't:</strong> a random ID stored in your
          browser's local storage, so we can remember your activity without
          knowing who you are.
        </li>
        <li>
          <strong>Activity:</strong> destinations you view, searches you
          run, and favorites you save — used to power your personal
          dashboard and, in later phases, recommendations.
        </li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">Third parties we use</h2>
      <ul className="list-disc pl-6 text-gray-700 space-y-1">
        <li>Geoapify — place search</li>
        <li>Pexels — destination images</li>
        <li>OpenWeatherMap — live weather</li>
        <li>Amadeus — hotel price estimates</li>
      </ul>
      <p className="text-gray-500 mt-2 text-sm">
        We send them only what's needed to answer a specific request (e.g.
        a city name) — never your account details.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">Cookies</h2>
      <p className="text-gray-700">
        A session cookie keeps you signed in. It's httpOnly, meaning
        JavaScript can't read it, which protects it from a common class of
        attacks. It expires after 7 days.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">Your rights</h2>
      <p className="text-gray-700">
        If you have an account, you can download everything we hold about
        you, or permanently delete your account and all associated data, at
        any time from the <strong>My Activity</strong> page.
      </p>
    </div>
  );
}
