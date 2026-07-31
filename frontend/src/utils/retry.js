// Render's free tier spins the backend down after 15 minutes idle; the
// first request after that can take 30-50s to wake it back up, and may
// fail outright while it's still starting. Retries with backoff so a cold
// start looks like "loading a bit longer," not a broken page.
export const retryFetch = async (
  fn,
  { attempts = 3, delayMs = 10000, isValid = (result) => Boolean(result) } = {}
) => {
  let lastResult;

  for (let attempt = 0; attempt < attempts; attempt++) {
    lastResult = await fn();

    if (isValid(lastResult)) {
      return lastResult;
    }

    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return lastResult;
};
