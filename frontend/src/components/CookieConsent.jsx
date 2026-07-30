import React, { useEffect, useState } from "react";

const CONSENT_KEY = "cookieConsent";

export default function CookieConsent({ onOpenPrivacy }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 z-50 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-sm">
        We use a session cookie to keep you signed in and a local browser ID
        to remember your recent activity, even before you create an account.{" "}
        <button
          onClick={onOpenPrivacy}
          className="underline hover:text-gray-300"
        >
          Learn more
        </button>
      </p>

      <button
        onClick={accept}
        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
      >
        Got it
      </button>
    </div>
  );
}
