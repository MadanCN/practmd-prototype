import CcLayout from "@/components/care-coordinator/layout/CcLayout";
import ComingSoon from "@/components/ui/ComingSoon";

export default function MessagesPage() {
  return (
    <CcLayout>
      <ComingSoon title="Messages" description="Secure messaging with patients and providers coming soon." />
    </CcLayout>
  );
}
