export type LeaveType = "leave" | "vacation" | "unavailable";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type ResolutionMethod = "notify-cc" | "reschedule-time" | "reschedule-provider";

export interface AppointmentResolution {
  appointmentId: string;
  method: ResolutionMethod | null;
  notifiedStaffIds?: string[];
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
  newProviderId?: string;
}

export interface ProviderLeaveRequest {
  id: string;
  providerId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
  reason: string;
  notes?: string;
  status: LeaveStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  rejectionReason?: string;
  conflictingAppointmentIds?: string[];
  appointmentResolutions?: AppointmentResolution[];
}

function d(offset: number): string {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + offset);
  return base.toISOString().split("T")[0];
}

export const PROVIDER_LEAVE_REQUESTS: ProviderLeaveRequest[] = [
  {
    id: "lr1",
    providerId: "p1",
    type: "vacation",
    startDate: d(1),
    endDate: d(3),
    isFullDay: true,
    reason: "Family vacation — planned travel",
    notes: "Will be unavailable for this period. Please arrange coverage.",
    status: "pending",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    conflictingAppointmentIds: ["a70", "a71", "a72"],
  },
  {
    id: "lr2",
    providerId: "p1",
    type: "leave",
    startDate: d(-7),
    endDate: d(-7),
    isFullDay: false,
    startTime: "14:00",
    endTime: "17:00",
    reason: "Medical appointment — personal",
    status: "approved",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    resolvedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    resolvedBy: "admin",
    conflictingAppointmentIds: [],
  },
  {
    id: "lr3",
    providerId: "p2",
    type: "unavailable",
    startDate: d(7),
    endDate: d(7),
    isFullDay: true,
    reason: "Conference attendance — required",
    notes: "Attending state psychiatric association annual meeting.",
    status: "pending",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    conflictingAppointmentIds: [],
  },
  {
    id: "lr4",
    providerId: "p1",
    type: "leave",
    startDate: d(-20),
    endDate: d(-20),
    isFullDay: true,
    reason: "Personal day",
    status: "rejected",
    createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
    resolvedAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    resolvedBy: "admin",
    rejectionReason: "Insufficient coverage available for the day.",
  },
];
