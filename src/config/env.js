// src/config/env.js
// Central place to read typed environment variables with helpful errors.

const optional = (key, fallback = undefined) => {
  const value = process.env[key];
  return value !== undefined ? value : fallback;
};

const required = (key) => {
  const value = optional(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  firebase: {
    apiKey: required("REACT_APP_FIREBASE_API_KEY"),
    authDomain: required("REACT_APP_FIREBASE_AUTH_DOMAIN"),
    projectId: required("REACT_APP_FIREBASE_PROJECT_ID"),
    storageBucket: required("REACT_APP_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: required("REACT_APP_FIREBASE_MESSAGING_SENDER_ID"),
    appId: required("REACT_APP_FIREBASE_APP_ID"),
    measurementId: optional("REACT_APP_FIREBASE_MEASUREMENT_ID"),
  },
  functionsRegion: optional(
    "REACT_APP_FIREBASE_FUNCTIONS_REGION",
    "australia-southeast1"
  ),
  functionsBaseUrl: optional("REACT_APP_FUNCTIONS_BASE_URL", ""),
  aiEndpoint: required("REACT_APP_AI_ENDPOINT"),
  newsletterEndpoint: required("REACT_APP_NEWSLETTER_ENDPOINT"),
  stripePublishableKey: required("REACT_APP_STRIPE_PUBLISHABLE_KEY"),
};

export function resolveFunctionsUrl(path) {
  if (!path.startsWith("/")) {
    throw new Error(`Functions path must start with '/': ${path}`);
  }
  if (env.functionsBaseUrl) {
    return `${env.functionsBaseUrl}${path}`;
  }
  // If no explicit base URL is configured fall back to regional Google Cloud Functions URL.
  const projectId = env.firebase.projectId;
  return `https://${env.functionsRegion}-${projectId}.cloudfunctions.net${path}`;
}
