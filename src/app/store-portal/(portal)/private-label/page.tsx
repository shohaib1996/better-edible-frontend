import { Suspense } from "react";
import { PrivateLabelPage } from "@/components/StorePortal/PrivateLabel";

export default function PrivateLabel() {
  return (
    <Suspense>
      <PrivateLabelPage />
    </Suspense>
  );
}
