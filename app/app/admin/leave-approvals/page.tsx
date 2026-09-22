"use client";

// Leave Approvals is now a tab of Approval — this route just forwards there
// (kept in case anything still links or has this bookmarked).

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LeaveApprovalsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/approvals?tab=leave");
  }, [router]);
  return null;
}
