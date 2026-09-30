import { Suspense } from "react";
import PrioritiesView from "@/components/product/roadmap/PrioritiesView";

export default function PrioritiesPage() {
  return (
    <Suspense>
      <PrioritiesView />
    </Suspense>
  );
}
