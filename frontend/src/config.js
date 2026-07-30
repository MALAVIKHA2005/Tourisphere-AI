// REACT_APP_API_URL must be set at build time for a deployed frontend to
// reach the real backend -- Create React App bakes REACT_APP_* vars into
// the build, they can't be changed at runtime after `npm run build`.
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
