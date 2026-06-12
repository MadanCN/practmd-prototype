import {
  Building2,
  Users,
  Stethoscope,
  CalendarDays,
  MessageSquare,
  UserCircle2,
  CreditCard,
  CheckSquare,
  Plug,
  type LucideIcon,
} from "lucide-react";

export interface GmLeaf {
  kind: "leaf";
  label: string;
  href: string;
}

export interface GmGroup {
  kind: "group";
  id: string;
  label: string;
  children: GmLeaf[];
}

export type GmSectionChild = GmLeaf | GmGroup;

export interface GmSection {
  id: string;
  number: number;
  label: string;
  icon: LucideIcon;
  description: string;
  href: string;
  children: GmSectionChild[];
}

const leaf = (label: string, href: string): GmLeaf => ({ kind: "leaf", label, href });
const group = (id: string, label: string, children: GmLeaf[]): GmGroup => ({ kind: "group", id, label, children });
const base = "/global-masters";

export const GM_SECTIONS: GmSection[] = [
  {
    id: "organization",
    number: 1,
    label: "Organization",
    icon: Building2,
    description: "Rooms, equipment, locations, holidays, and org settings",
    href: `${base}/organization`,
    children: [
      group("resources", "Resources", [
        leaf("Room Types", `${base}/organization/room-types`),
        leaf("Equipment Types", `${base}/organization/equipment-types`),
      ]),
      group("locations", "Locations", [
        leaf("Country", `${base}/organization/locations/country`),
        leaf("State", `${base}/organization/locations/state`),
        leaf("City", `${base}/organization/locations/city`),
      ]),
      leaf("Holidays", `${base}/organization/holidays`),
    ],
  },
  {
    id: "users-access",
    number: 2,
    label: "Users & Access",
    icon: Users,
    description: "Roles, permissions, and provider configurations",
    href: `${base}/users-access`,
    children: [
      group("roles", "Roles", [
        leaf("Administrative Roles", `${base}/users-access/roles/administrative`),
        leaf("Staff Roles", `${base}/users-access/roles/staff`),
        leaf("Provider Permissions", `${base}/users-access/roles/provider-permissions`),
      ]),
      group("providers", "Providers", [
        leaf("Provider Types", `${base}/users-access/providers/provider-types`),
        leaf("Specializations", `${base}/users-access/providers/specializations`),
      ]),
    ],
  },
  {
    id: "clinical",
    number: 3,
    label: "Clinical",
    icon: Stethoscope,
    description: "Services, visit types, forms, and document definitions",
    href: `${base}/clinical`,
    children: [
      leaf("Services", `${base}/clinical/services`),
      leaf("Visit Types", `${base}/clinical/visit-types`),
      leaf("Form Preferences", `${base}/clinical/form-preferences`),
      leaf("Document Types", `${base}/clinical/document-types`),
      leaf("Referral Source", `${base}/clinical/referral-source`),
    ],
  },
  {
    id: "scheduling",
    number: 4,
    label: "Scheduling",
    icon: CalendarDays,
    description: "Preferences, rules, and booking configurations",
    href: `${base}/scheduling`,
    children: [
      group("cancellation-reasons-group", "Cancellation & Reschedule", [
        leaf("Cancellation Reasons", `${base}/scheduling/cancellation-reasons`),
        leaf("Reschedule Reasons", `${base}/scheduling/reschedule-reasons`),
      ]),
      group("appointment-settings-group", "Appointment Settings", [
        leaf("Appointment Settings", `${base}/scheduling/appointment-settings`),
        leaf("No Show Setting", `${base}/scheduling/no-show-setting`),
        leaf("Reschedule Setting", `${base}/scheduling/reschedule-setting`),
        leaf("Appointment Cancellation Setting", `${base}/scheduling/appointment-cancellation-setting`),
        leaf("Waitlist Setting", `${base}/scheduling/waitlist-setting`),
        leaf("Appointment Preferences", `${base}/scheduling/appointment-preferences`),
      ]),
      leaf("Provider Schedule Rules", `${base}/scheduling/provider-schedule-rules`),
      leaf("Self Scheduling", `${base}/scheduling/self-scheduling`),
      leaf("Web Embeds", `${base}/scheduling/web-embeds`),
      leaf("Appointment Agent", `${base}/scheduling/appointment-agent`),
    ],
  },
  {
    id: "patient-communication",
    number: 5,
    label: "Patient Communication",
    icon: MessageSquare,
    description: "SMS, email, voice, phone calls, and message templates",
    href: `${base}/patient-communication`,
    children: [
      leaf("SMS", `${base}/patient-communication/sms`),
      leaf("Email", `${base}/patient-communication/email`),
      leaf("Voice", `${base}/patient-communication/voice`),
      leaf("Phone Calls", `${base}/patient-communication/phone-calls`),
      leaf("Message Templates", `${base}/patient-communication/message-templates`),
    ],
  },
  {
    id: "patient-management",
    number: 6,
    label: "Patient Management",
    icon: UserCircle2,
    description: "Demographics, classification, registration, and recall",
    href: `${base}/patient-management`,
    children: [
      group("demographics", "Demographics", [
        leaf("Gender", `${base}/patient-management/demographics/gender`),
        leaf("Pronoun", `${base}/patient-management/demographics/pronoun`),
        leaf("Marital Status", `${base}/patient-management/demographics/marital-status`),
        leaf("Relationship to Patient", `${base}/patient-management/demographics/relationship`),
        leaf("Contact Methods", `${base}/patient-management/demographics/contact-methods`),
      ]),
      group("patient-classification", "Patient Classification", [
        leaf("Patient Type", `${base}/patient-management/patient-classification/patient-type`),
        leaf("Patient Stage", `${base}/patient-management/patient-classification/patient-stage`),
      ]),
      leaf("Registration", `${base}/patient-management/registration`),
      group("recall-management", "Recall Management", [
        leaf("Recall Types", `${base}/patient-management/recall-management/recall-types`),
        leaf("Recall Status", `${base}/patient-management/recall-management/recall-status`),
        leaf("Recall Preference", `${base}/patient-management/recall-management/recall-preference`),
      ]),
    ],
  },
  {
    id: "billing-coding",
    number: 7,
    label: "Billing & Coding",
    icon: CreditCard,
    description: "Insurers and procedure code management",
    href: `${base}/billing-coding`,
    children: [
      leaf("Insurers", `${base}/billing-coding/insurers`),
      leaf("Procedure Codes", `${base}/billing-coding/procedure-codes`),
    ],
  },
  {
    id: "tasks",
    number: 8,
    label: "Tasks",
    icon: CheckSquare,
    description: "Escalation time and workflow configuration",
    href: `${base}/tasks`,
    children: [
      leaf("Escalations", `${base}/tasks/escalations`),
    ],
  },
  {
    id: "practmd-connect",
    number: 9,
    label: "PractMD Connect",
    icon: Plug,
    description: "Telehealth, integrations, and AI configuration",
    href: `${base}/practmd-connect`,
    children: [
      leaf("Telehealth Provisions", `${base}/practmd-connect/telehealth-provisions`),
      leaf("Telehealth Settings", `${base}/practmd-connect/telehealth-settings`),
      leaf("Google Calendar", `${base}/practmd-connect/google-calendar`),
      leaf("AI Agent", `${base}/practmd-connect/ai-agent`),
    ],
  },
];
