import { MapPinOff } from "lucide-react";

import { FailureState } from "@/components/layout/failure-state";
import { ButtonLink } from "@/components/ui/button";

/**
 * Reached by `notFound()` on a house or flock that does not exist, and by any
 * mistyped address. Without this file the framework's own unbranded page shows
 * instead, which reads as the app being broken rather than the link being old.
 */
export default function NotFound() {
  return (
    <FailureState
      icon={MapPinOff}
      title="That page does not exist"
      description="The link may be out of date, or the record it pointed at has since been removed."
    >
      <ButtonLink href="/">Back to dashboard</ButtonLink>
    </FailureState>
  );
}
