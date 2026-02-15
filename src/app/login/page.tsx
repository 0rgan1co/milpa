import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/features/auth/login-form";
import { getAuthenticatedUser } from "@/server/auth/middleware";

export default async function LoginPage() {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in to Milpa</CardTitle>
          <p className="text-sm text-slate-400">
            Use your Firebase-authenticated account to access dashboards.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm />
          <div className="space-y-2 text-center text-sm text-slate-400">
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline underline-offset-4">
                Create one
              </Link>
            </p>
            <p>
              <Link href="/" className="underline underline-offset-4">
                Back to home
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
