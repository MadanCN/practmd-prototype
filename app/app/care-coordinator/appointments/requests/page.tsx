import CcLayout from "@/components/care-coordinator/layout/CcLayout";
import RequestsView from "@/components/care-coordinator/appointments/RequestsView";

export default function RequestsPage() {
  return (
    <CcLayout>
      <div className="h-full">
        <RequestsView />
      </div>
    </CcLayout>
  );
}
