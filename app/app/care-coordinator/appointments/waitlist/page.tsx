import CcLayout from "@/components/care-coordinator/layout/CcLayout";
import WaitlistView from "@/components/care-coordinator/appointments/WaitlistView";

export default function WaitlistPage() {
  return (
    <CcLayout>
      <div className="h-full">
        <WaitlistView />
      </div>
    </CcLayout>
  );
}
