import { Suspense } from "react";
import SamplesListContent from "./samples-content";
import SamplesLoading from "./loading";

export default function SamplesPage() {
  return (
    <Suspense fallback={<SamplesLoading />}>
      <SamplesListContent />
    </Suspense>
  );
}
