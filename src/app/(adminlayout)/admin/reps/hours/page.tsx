import { Suspense } from "react";
import RepsHoursLoading from "./loading";
import RepsHoursContent from "./reps-hours-content";

export default function TimeLogsSummaryPage() {
  return (
    <Suspense fallback={<RepsHoursLoading />}>
      <RepsHoursContent />
    </Suspense>
  );
}
