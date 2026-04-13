import { Suspense } from "react";
import WellnessContent from "@/components/wellness/WellnessContent";
import WellnessSkeleton from "@/components/wellness/WellnessSkeleton";

export default function WellnessPage() {
  return (
    <Suspense fallback={<WellnessSkeleton />}>
      <WellnessContent />
    </Suspense>
  );
}