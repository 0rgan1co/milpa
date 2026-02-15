"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4">
      <div className="bg-red-50 p-4 rounded-full">
        <AlertCircle className="h-10 w-10 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-muted-foreground max-w-md">
        An unexpected error occurred. We&apos;ve been notified and are working
        on it.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => reset()} variant="outline" className="gap-2">
          <RefreshCcw className="h-4 w-4" /> Try again
        </Button>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
