import CcLayout from "@/components/care-coordinator/layout/CcLayout";
import CalendarView from "@/components/care-coordinator/appointments/CalendarView";

export default function CalendarPage() {
  return (
    <CcLayout>
      <div className="h-full">
        <CalendarView />
      </div>
    </CcLayout>
  );
}
