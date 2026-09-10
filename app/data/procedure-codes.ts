// Procedure (CPT) code master — the single source of truth shared by the
// Global Masters "Procedure Codes" screen and the encounter-note editor's
// procedure rows. A provider typing a code or a description in the note gets
// suggestions from here; picking one fills the code, description, standard
// charge and place of service.

export interface ProcedureCode {
  id: string;
  code: string;
  description: string;
  category: string;
  /** standard bill for this line, from the master */
  charge: number;
  discount: number;
  modifier: string;
  pos: string;
  taxable: boolean;
  displayOrder: number;
  isActive: boolean;
}

export const PROCEDURE_CODE_CATEGORIES = [
  { value: "psychotherapy", label: "Psychotherapy" },
  { value: "evaluation", label: "Evaluation & Management" },
  { value: "assessment", label: "Assessment" },
  { value: "group", label: "Group Therapy" },
  { value: "crisis", label: "Crisis Intervention" },
  { value: "medication", label: "Medication / Add-on" },
  { value: "other", label: "Other" },
];

export const PROCEDURE_CODE_POS_OPTIONS = [
  { value: "02", label: "02 — Telehealth" },
  { value: "10", label: "10 — Telehealth (Home)" },
  { value: "11", label: "11 — Office" },
  { value: "12", label: "12 — Home" },
  { value: "99", label: "99 — Other" },
];

export const PROCEDURE_CODE_MASTER: ProcedureCode[] = [
  { id: "1", code: "90791", description: "Psychiatric Diagnostic Evaluation", category: "evaluation", charge: 350, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 1, isActive: true },
  { id: "2", code: "90792", description: "Psychiatric Diagnostic Evaluation with medical services", category: "evaluation", charge: 375, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 2, isActive: true },
  { id: "3", code: "90832", description: "Psychotherapy, 30 minutes", category: "psychotherapy", charge: 120, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 3, isActive: true },
  { id: "4", code: "90834", description: "Psychotherapy, 45 minutes", category: "psychotherapy", charge: 160, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 4, isActive: true },
  { id: "5", code: "90837", description: "Psychotherapy, 60 minutes", category: "psychotherapy", charge: 200, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 5, isActive: true },
  { id: "6", code: "90833", description: "Psychotherapy, 30 min with E/M (add-on)", category: "psychotherapy", charge: 90, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 6, isActive: true },
  { id: "7", code: "90836", description: "Psychotherapy, 45 min with E/M (add-on)", category: "psychotherapy", charge: 120, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 7, isActive: true },
  { id: "8", code: "90838", description: "Psychotherapy, 60 min with E/M (add-on)", category: "psychotherapy", charge: 150, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 8, isActive: true },
  { id: "9", code: "99212", description: "Office/Outpatient Visit, Established Patient — Straightforward", category: "evaluation", charge: 110, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 9, isActive: true },
  { id: "10", code: "99213", description: "Office/Outpatient Visit, Established Patient — Low Complexity", category: "evaluation", charge: 175, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 10, isActive: true },
  { id: "11", code: "99214", description: "Office/Outpatient Visit, Established Patient — Moderate Complexity", category: "evaluation", charge: 215, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 11, isActive: true },
  { id: "12", code: "99215", description: "Office/Outpatient Visit, Established Patient — High Complexity", category: "evaluation", charge: 260, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 12, isActive: true },
  { id: "13", code: "99204", description: "Office/Outpatient Visit, New Patient — Moderate Complexity", category: "evaluation", charge: 300, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 13, isActive: true },
  { id: "14", code: "99205", description: "Office/Outpatient Visit, New Patient — High Complexity", category: "evaluation", charge: 360, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 14, isActive: true },
  { id: "15", code: "90853", description: "Group Psychotherapy", category: "group", charge: 80, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 15, isActive: true },
  { id: "16", code: "90839", description: "Psychotherapy for Crisis — first 60 minutes", category: "crisis", charge: 285, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 16, isActive: true },
  { id: "17", code: "90840", description: "Psychotherapy for Crisis — each additional 30 minutes (add-on)", category: "crisis", charge: 140, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 17, isActive: true },
  { id: "18", code: "96136", description: "Psychological/Neuropsychological Testing — first hour", category: "assessment", charge: 450, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 18, isActive: true },
  { id: "19", code: "96127", description: "Brief Emotional/Behavioral Assessment (e.g. PHQ-9, GAD-7)", category: "assessment", charge: 25, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 19, isActive: true },
  { id: "20", code: "99406", description: "Smoking & Tobacco Cessation Counseling — 3–10 minutes", category: "medication", charge: 30, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 20, isActive: true },
  { id: "21", code: "J3490", description: "Esketamine (Spravato) administration — unclassified drug", category: "medication", charge: 285, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 21, isActive: true },
  { id: "22", code: "90867", description: "TMS — initial, motor threshold determination", category: "medication", charge: 300, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 22, isActive: true },
  { id: "23", code: "90868", description: "TMS — subsequent delivery & management", category: "medication", charge: 220, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 23, isActive: true },
];

/** Type-ahead over the active master by code OR description (providers search both). */
export function searchProcedureCodes(query: string, limit = 8): ProcedureCode[] {
  const q = query.trim().toLowerCase();
  const active = PROCEDURE_CODE_MASTER.filter((c) => c.isActive);
  if (!q) return active.slice(0, limit);
  const starts = active.filter((c) => c.code.toLowerCase().startsWith(q));
  const rest = active.filter(
    (c) => !c.code.toLowerCase().startsWith(q) && (c.code.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)),
  );
  return [...starts, ...rest].slice(0, limit);
}

export function procedureCodeByCode(code: string): ProcedureCode | undefined {
  return PROCEDURE_CODE_MASTER.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
}
