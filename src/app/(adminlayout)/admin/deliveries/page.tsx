export const dynamic = 'force-dynamic';
import { Suspense } from "react";
import DeliveriesLoading from "./loading";
import DeliveriesContent from "./deliveries-content";

export default function DeliveriesPage() {
  return (
    <Suspense fallback={<DeliveriesLoading />}>
      <DeliveriesContent />
    </Suspense>
  );
}
