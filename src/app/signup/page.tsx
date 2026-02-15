import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/components/features/auth/signup-form";
import { getAuthenticatedUser } from "@/server/auth/middleware";

export default async function SignupPage() {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-2xl">Create your Milpa account</CardTitle>
          <p className="text-sm text-slate-400">
            Sign up with email/password to access dashboards.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignupForm />
          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
