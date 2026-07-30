export const getDestinationKey = (destination) => {
  if (destination.id !== undefined && destination.id !== null) {
    return String(destination.id);
  }

  const name = (destination.name || "").trim().toLowerCase();
  const country = (destination.country || "").trim().toLowerCase();

  return `${name}|${country}`;
};
