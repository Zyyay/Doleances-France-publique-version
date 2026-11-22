"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";

/**
 * Only fires if the root layout itself throws — app/error.tsx (which reuses
 * the branded StatusScreen) handles everything else. This can't reuse
 * StatusScreen since the root layout (which normally renders <html>/<body>)
 * is exactly what crashed, so this has to render its own minimal shell.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
