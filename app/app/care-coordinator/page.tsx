import { redirect } from "next/navigation";

export default function CcRootPage() {
  redirect("/care-coordinator/appointments/calendar");
}
