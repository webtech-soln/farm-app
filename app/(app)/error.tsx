"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { FailureState } from "@/components/layout/failure-state";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Catches a failure inside a board, leaving the shell — sidebar, topbar,
 * whatever else was already on screen — intact, so the person can navigate
 * away instead of losing the whole app to one bad query.
 */
export default function BoardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The server has already logged this with its own request id; this records
    // that it actually reached someone.
    console.error("[board] render failed", error);
  }, [error]);

  return (
    <FailureState
      icon={TriangleAlert}
      title="This board could not be loaded"
      description="Something went wrong while fetching the records for this page. The rest of the app is unaffected — try again, and if it keeps happening quote the reference below."
      reference={error.digest}
    >
      <Button onClick={reset}>Try again</Button>
      <ButtonLink href="/" variant="secondary">
        Back to dashboard
      </ButtonLink>
    </FailureState>
  );
}
