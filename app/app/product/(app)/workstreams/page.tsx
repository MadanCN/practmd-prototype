import { Suspense } from "react";
import WorkstreamsView from "@/components/product/roadmap/WorkstreamsView";

export default function WorkstreamsPage() {
  return (
    <Suspense>
      <WorkstreamsView />
    </Suspense>
  );
}
