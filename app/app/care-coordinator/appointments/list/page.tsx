import CcLayout from "@/components/care-coordinator/layout/CcLayout";
import ListView from "@/components/care-coordinator/appointments/ListView";

export default function ListPage() {
  return (
    <CcLayout>
      <div className="h-full">
        <ListView />
      </div>
    </CcLayout>
  );
}
