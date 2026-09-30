import { Suspense } from "react";
import ChallengesView from "@/components/product/challenges/ChallengesView";

export default function ChallengesPage() {
  return (
    <Suspense>
      <ChallengesView />
    </Suspense>
  );
}
