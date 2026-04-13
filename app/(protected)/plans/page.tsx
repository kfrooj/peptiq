import { Suspense } from "react";
import PlansContent from "@/components/plans/PlansContent";
import PlansSkeleton from "@/components/plans/PlansSkeleton";

export default function PlansPage() {
  return (
    <Suspense fallback={<PlansSkeleton />}>
      <PlansContent />
    </Suspense>
  );
}