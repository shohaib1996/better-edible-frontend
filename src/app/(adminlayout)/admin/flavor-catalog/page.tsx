import { Suspense } from "react";
import FlavorCatalogLoading from "./loading";
import FlavorCatalogContent from "./flavor-catalog-content";

export default function FlavorCatalogPage() {
  return (
    <Suspense fallback={<FlavorCatalogLoading />}>
      <FlavorCatalogContent />
    </Suspense>
  );
}
