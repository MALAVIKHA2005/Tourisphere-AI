const GUEST_ID_KEY = "guestId";

const generateId = () => {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const getGuestId = () => {
  let guestId = localStorage.getItem(GUEST_ID_KEY);

  if (!guestId) {
    guestId = generateId();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }

  return guestId;
};
