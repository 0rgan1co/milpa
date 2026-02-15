import * as admin from "firebase-admin";

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is missing. Set it in your environment as a JSON string.",
    );
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      throw new Error("Missing required fields in FIREBASE_SERVICE_ACCOUNT");
    }
    return parsed;
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT must be valid JSON with project_id, client_email, and private_key.",
    );
  }
}

function getAdminApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccount = parseServiceAccount();
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export function getAdminAuth() {
  return getAdminApp().auth();
}

export function getAdminDb() {
  return getAdminApp().firestore();
}
