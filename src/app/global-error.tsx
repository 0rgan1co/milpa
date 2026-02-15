"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-4 bg-background">
          <h2 className="text-3xl font-bold">Critical System Error</h2>
          <p className="text-muted-foreground max-w-md">
            The application encountered a fatal error and cannot recover.
          </p>
          <button
            onClick={() => reset()}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-bold"
          >
            Reset Application
          </button>
        </div>
      </body>
    </html>
  );
}
