import { Suspense } from "react";
import TimelineView from "@/components/product/roadmap/TimelineView";

export default function TimelinePage() {
  return (
    <Suspense>
      <TimelineView />
    </Suspense>
  );
}
