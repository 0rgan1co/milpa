import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/server/auth/firebase-admin";

const SESSION_MAX_AGE = 60 * 60 * 24 * 5;

export async function POST(request: NextRequest) {
  try {
    const { idToken } = (await request.json()) as { idToken?: string };

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE * 1000,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: "session",
      value: sessionCookie,
      maxAge: SESSION_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Failed to create session cookie:", error);
    return NextResponse.json(
      { error: "Unable to create session" },
      { status: 401 },
    );
  }
}
