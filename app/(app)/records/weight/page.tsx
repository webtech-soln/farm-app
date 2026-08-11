import { Plus, Scale } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * The sidebar carries a Weight entry but the design has no board for it, so
 * this renders the shared empty state and points at the surfaces that do
 * capture weight (daily records, flock detail).
 */
export default function WeightPage() {
  return (
    <>
      <PageHeader
        title="Weight Sampling"
        breadcrumb={["Operations", "Weight"]}
        subtitle="Sampled averages roll up here once records are captured."
      >
        <Button icon={Plus}>Record Weights</Button>
      </PageHeader>

      <EmptyState
        icon={Scale}
        title="No weight samples yet"
        description="Sample at least 30 birds per flock to build a growth curve against the breed standard."
      >
        <ButtonLink href="/records/daily" icon={Plus}>
          Record Weights
        </ButtonLink>
        <ButtonLink href="/flocks" variant="secondary">
          View flocks
        </ButtonLink>
      </EmptyState>
    </>
  );
}
