export const CANCELLATION_REASONS = [
  { value: "patient-request", label: "Patient Request" },
  { value: "provider-unavailable", label: "Provider Unavailable" },
  { value: "administrative-error", label: "Administrative Error" },
  { value: "duplicate-booking", label: "Duplicate Booking" },
  { value: "insurance-issue", label: "Insurance Issue" },
  { value: "family-emergency", label: "Family Emergency" },
  { value: "medical-emergency", label: "Medical Emergency" },
  { value: "weather-transportation", label: "Weather / Transportation" },
  { value: "no-show", label: "No Show" },
  { value: "other", label: "Other" },
] as const;

export const RESCHEDULE_REASONS = [
  { value: "patient-request", label: "Patient Request" },
  { value: "provider-conflict", label: "Provider Schedule Conflict" },
  { value: "patient-conflict", label: "Patient Schedule Conflict" },
  { value: "administrative", label: "Administrative" },
  { value: "medical-reason", label: "Medical Reason" },
  { value: "follow-up", label: "Follow-Up Needed" },
  { value: "other", label: "Other" },
] as const;

// Master configuration — in production these come from admin settings
export const CLINIC_CONFIG = {
  checkInBufferMins: 15,          // allow check-in N min before appointment
  autoEligibilityOnCheckin: true, // run insurance eligibility check on check-in
  noShowWindowMins: 30,           // mark no-show after N min past start
  cancellationWindowHrs: 24,      // late-cancel warning if within this window
  rescheduleWindowHrs: 48,        // only allow rescheduling appts within last N hours
  offerExpiryHrs: 2,              // waitlist offer expires after N hours
  lateCancellationFee: 50,        // USD default fee for late cancellation
  noShowFee: 75,                  // USD default fee for no-show
};
