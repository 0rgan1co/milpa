import { cookies } from "next/headers";
import { getAdminAuth } from "./firebase-admin";

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifySessionCookie(
      sessionCookie,
      true,
    );
    return decodedToken;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}

export async function verifyToken(idToken: string) {
  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return null;
  }
}
