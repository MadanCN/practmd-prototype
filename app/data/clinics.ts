export type DayName = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
export const DAYS: DayName[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export interface BusinessHour {
  day: DayName;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStart: string;
  breakEnd: string;
}

export interface ClinicAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  isActive: boolean;
}

export interface ClinicLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  isPrimary: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  practice: string;
  isActive: boolean;
  phone: string;
  fax: string;
  email: string;
  website: string;
  npi: string;
  tin: string;
  timezone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  staffCount: number;
  adminCount: number;
  providerCount: number;
  hasClinicApp: boolean;
  hasOperationsApp: boolean;
  hasPatientPortal: boolean;
  businessHours: BusinessHour[];
  logoEmoji: string;
  admins: ClinicAdmin[];
  locations: ClinicLocation[];
}

function bh(
  day: DayName, isOpen: boolean,
  openTime = "08:00", closeTime = "17:00",
  breakStart = "12:00", breakEnd = "13:00"
): BusinessHour {
  return { day, isOpen, openTime, closeTime, breakStart, breakEnd };
}

export const CLINICS: Clinic[] = [
  {
    id: "new-hartford",
    name: "New Hartford Psychological Services",
    slug: "penfieldpsych-1-1-1",
    practice: "Penfield Psychiatry, PC",
    isActive: true,
    phone: "+1 (315) 555-0100",
    fax: "+1 (315) 555-0101",
    email: "info@newhartfordpsych.com",
    website: "https://newhartfordpsych.com",
    npi: "1234567890",
    tin: "12-3456789",
    timezone: "America/New_York",
    address: "2307 Genesee Street",
    city: "Utica",
    state: "New York",
    zip: "13501",
    staffCount: 12,
    adminCount: 2,
    providerCount: 6,
    hasClinicApp: true,
    hasOperationsApp: true,
    hasPatientPortal: true,
    logoEmoji: "🌿",
    businessHours: [
      bh("Monday", true), bh("Tuesday", true), bh("Wednesday", true),
      bh("Thursday", true), bh("Friday", true),
      bh("Saturday", false), bh("Sunday", false),
    ],
    admins: [
      { id: "a1", name: "Jennifer Walsh", email: "j.walsh@newhartfordpsych.com", role: "Clinic Admin", phone: "+1 (315) 555-0110", isActive: true },
      { id: "a2", name: "Robert Chen", email: "r.chen@newhartfordpsych.com", role: "Operations Admin", phone: "+1 (315) 555-0111", isActive: true },
    ],
    locations: [
      { id: "l1", name: "Main Office", address: "2307 Genesee Street", city: "Utica", state: "New York", zip: "13501", phone: "+1 (315) 555-0100", isPrimary: true },
    ],
  },
  {
    id: "penfield-psychiatry",
    name: "Penfield Psychiatry",
    slug: "penfield-psychiatry",
    practice: "Penfield Psychiatry",
    isActive: true,
    phone: "+1 (585) 388-6000",
    fax: "+1 (585) 388-6004",
    email: "info@penfieldpsych.com",
    website: "https://penfieldpsych.com",
    npi: "1649544116",
    tin: "16-4954411",
    timezone: "America/New_York",
    address: "2060 Fairport Nine Mile Pt. Rd., Suite 400",
    city: "Penfield",
    state: "New York",
    zip: "14526",
    staffCount: 18,
    adminCount: 3,
    providerCount: 8,
    hasClinicApp: false,
    hasOperationsApp: true,
    hasPatientPortal: true,
    logoEmoji: "🌳",
    businessHours: [
      bh("Monday", true, "08:00", "17:00", "12:00", "13:00"),
      bh("Tuesday", true, "08:00", "17:00", "12:00", "13:00"),
      bh("Wednesday", true, "08:00", "17:00", "12:00", "13:00"),
      bh("Thursday", true, "08:00", "17:00", "12:00", "13:00"),
      bh("Friday", true, "08:00", "17:00", "", ""),
      bh("Saturday", false), bh("Sunday", false),
    ],
    admins: [
      { id: "a3", name: "Sarah Kowalski", email: "s.kowalski@penfieldpsych.com", role: "Clinic Admin", phone: "+1 (585) 388-6010", isActive: true },
      { id: "a4", name: "Michael Torres", email: "m.torres@penfieldpsych.com", role: "Operations Admin", phone: "+1 (585) 388-6011", isActive: true },
      { id: "a5", name: "Amanda Park", email: "a.park@penfieldpsych.com", role: "Super Admin", phone: "+1 (585) 388-6012", isActive: true },
    ],
    locations: [
      { id: "l2", name: "Main Campus", address: "2060 Fairport Nine Mile Pt. Rd., Suite 400", city: "Penfield", state: "New York", zip: "14526", phone: "+1 (585) 388-6000", isPrimary: true },
      { id: "l3", name: "Satellite Office", address: "100 White Spruce Blvd", city: "Rochester", state: "New York", zip: "14623", phone: "+1 (585) 388-6020", isPrimary: false },
    ],
  },
  {
    id: "shore-counseling",
    name: "Shore Counseling",
    slug: "shore-counseling",
    practice: "Penfield Psychiatry",
    isActive: true,
    phone: "+1 (609) 555-0200",
    fax: "+1 (609) 555-0201",
    email: "info@shorecounseling.com",
    website: "",
    npi: "1234509876",
    tin: "",
    timezone: "America/New_York",
    address: "701 West Ave, STE 202",
    city: "Ocean City",
    state: "New Jersey",
    zip: "08226",
    staffCount: 9,
    adminCount: 1,
    providerCount: 4,
    hasClinicApp: false,
    hasOperationsApp: true,
    hasPatientPortal: true,
    logoEmoji: "🌊",
    businessHours: [
      bh("Monday", true, "09:00", "18:00", "13:00", "14:00"),
      bh("Tuesday", true, "09:00", "18:00", "13:00", "14:00"),
      bh("Wednesday", true, "09:00", "18:00", "13:00", "14:00"),
      bh("Thursday", true, "09:00", "18:00", "13:00", "14:00"),
      bh("Friday", true, "09:00", "17:00", "", ""),
      bh("Saturday", false), bh("Sunday", false),
    ],
    admins: [
      { id: "a6", name: "Lisa Martinez", email: "l.martinez@shorecounseling.com", role: "Clinic Admin", phone: "+1 (609) 555-0210", isActive: true },
    ],
    locations: [
      { id: "l4", name: "Main Office", address: "701 West Ave, STE 202", city: "Ocean City", state: "New Jersey", zip: "08226", phone: "+1 (609) 555-0200", isPrimary: true },
    ],
  },
];

export const PRACTICES = [...new Set(CLINICS.map(c => c.practice))];

export const TIMEZONES = [
  { label: "America/New_York (EST/EDT)", value: "America/New_York" },
  { label: "America/Chicago (CST/CDT)", value: "America/Chicago" },
  { label: "America/Denver (MST/MDT)", value: "America/Denver" },
  { label: "America/Los_Angeles (PST/PDT)", value: "America/Los_Angeles" },
  { label: "America/Phoenix (MST)", value: "America/Phoenix" },
  { label: "America/Anchorage (AKST)", value: "America/Anchorage" },
  { label: "Pacific/Honolulu (HST)", value: "Pacific/Honolulu" },
];
