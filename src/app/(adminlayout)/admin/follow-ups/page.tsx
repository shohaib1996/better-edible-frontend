import { Suspense } from "react";
import FollowUpsLoading from "./loading";
import FollowUpsContent from "./follow-ups-content";

export default function FollowUpsPage() {
  return (
    <Suspense fallback={<FollowUpsLoading />}>
      <FollowUpsContent />
    </Suspense>
  );
}
