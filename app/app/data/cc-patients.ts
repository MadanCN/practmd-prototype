export interface CcPatient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  insuranceProvider?: string;
  insuranceMemberId?: string;
  insuranceStatus?: "active" | "inactive" | "pending";
  primaryProviderId?: string;
}

export const CC_PATIENTS: CcPatient[] = [
  { id: "pt01", mrn: "MRN-00101", firstName: "James", lastName: "Holloway", displayName: "James Holloway", email: "james.holloway@email.com", phone: "+1 (585) 412-0101", dob: "1985-04-12", gender: "Male", insuranceProvider: "Aetna", insuranceMemberId: "AET-8812010", insuranceStatus: "active", primaryProviderId: "p1" },
  { id: "pt02", mrn: "MRN-00102", firstName: "Elena", lastName: "Vasquez", displayName: "Elena Vasquez", email: "e.vasquez@email.com", phone: "+1 (315) 498-0202", dob: "1992-07-30", gender: "Female", insuranceProvider: "Blue Cross", insuranceMemberId: "BC-4420202", insuranceStatus: "active", primaryProviderId: "p1" },
  { id: "pt03", mrn: "MRN-00103", firstName: "Marcus", lastName: "Webb", displayName: "Marcus Webb", email: "mwebb@email.com", phone: "+1 (585) 512-0303", dob: "1978-01-19", gender: "Male", insuranceProvider: "UnitedHealth", insuranceMemberId: "UH-9930303", insuranceStatus: "active", primaryProviderId: "p1" },
  { id: "pt04", mrn: "MRN-00104", firstName: "Priya", lastName: "Nair", displayName: "Priya Nair", email: "priya.nair@email.com", phone: "+1 (585) 601-0404", dob: "1996-11-05", gender: "Female", insuranceProvider: "Cigna", insuranceMemberId: "CI-5540404", insuranceStatus: "active", primaryProviderId: "p2" },
  { id: "pt05", mrn: "MRN-00105", firstName: "David", lastName: "Okafor", displayName: "David Okafor", email: "d.okafor@email.com", phone: "+1 (315) 777-0505", dob: "1981-08-22", gender: "Male", insuranceProvider: "Aetna", insuranceMemberId: "AET-7750505", insuranceStatus: "inactive", primaryProviderId: "p1" },
  { id: "pt06", mrn: "MRN-00106", firstName: "Sophia", lastName: "Kim", displayName: "Sophia Kim", email: "s.kim@email.com", phone: "+1 (585) 339-0606", dob: "1989-03-14", gender: "Female", insuranceProvider: "Medicaid", insuranceMemberId: "MC-1100606", insuranceStatus: "active", primaryProviderId: "p3" },
  { id: "pt07", mrn: "MRN-00107", firstName: "Robert", lastName: "Flynn", displayName: "Robert Flynn", email: "r.flynn@email.com", phone: "+1 (585) 221-0707", dob: "1974-12-01", gender: "Male", insuranceProvider: "Medicare", insuranceMemberId: "MR-3300707", insuranceStatus: "active", primaryProviderId: "p1" },
  { id: "pt08", mrn: "MRN-00108", firstName: "Aisha", lastName: "Thompson", displayName: "Aisha Thompson", email: "aisha.t@email.com", phone: "+1 (315) 850-0808", dob: "2001-06-18", gender: "Female", insuranceProvider: "Blue Cross", insuranceMemberId: "BC-8880808", insuranceStatus: "pending", primaryProviderId: "p3" },
  { id: "pt09", mrn: "MRN-00109", firstName: "Lucas", lastName: "Ferreira", displayName: "Lucas Ferreira", email: "lucas.f@email.com", phone: "+1 (585) 460-0909", dob: "1994-09-27", gender: "Male", insuranceProvider: "Cigna", insuranceMemberId: "CI-2200909", insuranceStatus: "active", primaryProviderId: "p2" },
  { id: "pt10", mrn: "MRN-00110", firstName: "Mei", lastName: "Zhang", displayName: "Mei Zhang", email: "mei.zhang@email.com", phone: "+1 (585) 712-1010", dob: "1987-02-09", gender: "Female", insuranceProvider: "UnitedHealth", insuranceMemberId: "UH-6611010", insuranceStatus: "active", primaryProviderId: "p3" },
  { id: "pt11", mrn: "MRN-00111", firstName: "Daniel", lastName: "Carter", displayName: "Daniel Carter", email: "d.carter@email.com", phone: "+1 (315) 533-1111", dob: "1970-05-31", gender: "Male", insuranceProvider: "Aetna", insuranceMemberId: "AET-4411111", insuranceStatus: "active", primaryProviderId: "p3" },
  { id: "pt12", mrn: "MRN-00112", firstName: "Fatima", lastName: "Al-Hassan", displayName: "Fatima Al-Hassan", email: "f.alhassan@email.com", phone: "+1 (585) 622-1212", dob: "1998-10-03", gender: "Female", insuranceProvider: "Medicaid", insuranceMemberId: "MC-7721212", insuranceStatus: "active", primaryProviderId: "p3" },
  { id: "pt13", mrn: "MRN-00113", firstName: "Tyler", lastName: "Nguyen", displayName: "Tyler Nguyen", email: "tyler.n@email.com", phone: "+1 (585) 490-1313", dob: "1983-07-16", gender: "Male", insuranceProvider: "Blue Cross", insuranceMemberId: "BC-3301313", insuranceStatus: "active", primaryProviderId: "p2" },
  { id: "pt14", mrn: "MRN-00114", firstName: "Carmen", lastName: "Rivera", displayName: "Carmen Rivera", email: "c.rivera@email.com", phone: "+1 (315) 888-1414", dob: "1977-11-28", gender: "Female", insuranceProvider: "Cigna", insuranceMemberId: "CI-9901414", insuranceStatus: "active", primaryProviderId: "p1" },
  { id: "pt15", mrn: "MRN-00115", firstName: "Aaron", lastName: "Scott", displayName: "Aaron Scott", email: "a.scott@email.com", phone: "+1 (585) 345-1515", dob: "1991-04-07", gender: "Male", insuranceProvider: "UnitedHealth", insuranceMemberId: "UH-1151515", insuranceStatus: "inactive", primaryProviderId: "p3" },
];
