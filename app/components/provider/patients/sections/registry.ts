import {
  LayoutGrid, CreditCard, CalendarDays, MessageSquare, CheckSquare, ShieldAlert,
  HeartPulse, NotebookPen, StickyNote, ClipboardList, Files, ContactRound,
  Pill, FlaskConical, History, Mail, type LucideIcon,
} from "lucide-react";

export interface SectionDef {
  id: string;
  label: string;
  icon: LucideIcon;
  /** shows a "Soon" tag in the rail and renders a ComingSoon body */
  soon?: boolean;
  /** one-line description of what the section will hold (placeholder body) */
  blurb: string;
}

export const SECTIONS: SectionDef[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid, blurb: "Demographics, contact, emergency & caregiver details, communication preferences, PHR registration and referral source." },
  { id: "billing", label: "Billing", icon: CreditCard, soon: true, blurb: "Claims, statements, balances and payment history." },
  { id: "appointments", label: "Appointments", icon: CalendarDays, blurb: "This patient's upcoming, past and pending / waitlisted appointments, with a detail drawer." },
  { id: "messages", label: "Messages", icon: MessageSquare, blurb: "Every secure-message thread involving this patient and its full conversation." },
  { id: "tasks", label: "Tasks", icon: CheckSquare, blurb: "Open and completed care tasks tied to this patient." },
  { id: "allergies", label: "Allergies", icon: ShieldAlert, blurb: "Allergen, severity, reaction, onset and status — with an add flow." },
  { id: "vitals", label: "Vitals", icon: HeartPulse, blurb: "Weight, height, BMI, blood pressure, temperature, pulse, respiration, SpO₂ and more, over time." },
  { id: "encounters", label: "Encounters", icon: NotebookPen, blurb: "Signed and unsigned encounter notes, with filters and a New Encounter flow into the note editor." },
  { id: "care-comments", label: "Care Comments", icon: StickyNote, blurb: "Timestamped notes from care coordinators and CRM — normal comments and alerts for the next visit." },
  { id: "forms", label: "Forms", icon: ClipboardList, blurb: "Assigned and completed forms (PHQ-9, GAD-7, MDQ …) with completion % and review actions." },
  { id: "documents", label: "Documents", icon: Files, blurb: "Uploaded documents with the same review lifecycle as forms." },
  { id: "phr-profile", label: "PHR Profile", icon: ContactRound, blurb: "The patient's profile exactly as they filled it in the personal health record." },
  { id: "medication", label: "Medication", icon: Pill, soon: true, blurb: "Active and past medications, prescriptions and refills." },
  { id: "lab-records", label: "Lab Records", icon: FlaskConical, soon: true, blurb: "Ordered and resulted labs with trends." },
  { id: "timeline", label: "Timeline", icon: History, blurb: "A full audit trail of everything on this chart — who viewed it and what they changed, from sign-up onward." },
  { id: "emails", label: "Emails", icon: Mail, blurb: "Every email sent to this patient, with delivery and open tracking." },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);
export const DEFAULT_SECTION = "overview";

export function getSection(id: string | null | undefined): SectionDef {
  return SECTIONS.find((s) => s.id === id) ?? SECTIONS[0];
}
