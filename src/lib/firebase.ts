import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

export function getClientAuth() {
  if (typeof window === "undefined") {
    // Return a dummy auth object or throw to prevent usage on server
    // Since we only use this in event handlers, it shouldn't be called on server.
    // But nextjs might verify imports.
    return {} as Auth;
  }

  if (firebaseAuth) {
    return firebaseAuth;
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || !authDomain || !projectId) {
    throw new Error(
      "Missing Firebase web config. Set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, and NEXT_PUBLIC_FIREBASE_PROJECT_ID.",
    );
  }

  const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
  };

  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  firebaseAuth = getAuth(firebaseApp);
  return firebaseAuth;
}

// Deprecated: Remove direct export to force lazy usage
// export const auth = getAuth(app);
