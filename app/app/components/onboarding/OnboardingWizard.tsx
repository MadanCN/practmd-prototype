"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, User, Users, Search, Upload, CheckCircle2, MapPin, Video,
  Clock, FileText, ShieldCheck, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createSubmission, submitAccountHolder, submitPatientInfo, submitCareIntent,
  submitInsurance, completeForms,
  type AccountHolder, type PatientIdentity, type InsuranceSubmission,
} from "@/lib/onboarding-store";

const TOTAL_STEPS = 6;

const CARE_TYPES = ["Talk Therapy", "Medication Management", "ADHD Services", "Spravato Treatment", "Assessments & Tests"];

const LOCATIONS = [
  { id: "telehealth", name: "Telehealth", subtitle: "Secure video visits", icon: Video },
  { id: "rochester", name: "Rochester", subtitle: "Penfield, NY · 14526", icon: MapPin },
  { id: "farmington", name: "Farmington", subtitle: "NY · 14425", icon: MapPin },
  { id: "albany", name: "Albany", subtitle: "NY · 12202", icon: MapPin },
];

const PAYERS = ["Highmark", "Aetna", "Anthem", "BlueCross BlueShield", "Excellus", "Lifetime Benefit Solutions", "Independent Health", "MVP Health Care"];

const RELATIONSHIPS = ["Self", "Spouse", "Parent", "Child", "Guardian", "Other"];

const FORMS: { name: string; minutes: number; required: boolean }[] = [
  { name: "Patient Health Information", minutes: 3, required: true },
  { name: "Modified Mini Screen", minutes: 2, required: false },
  { name: "HIPAA Consent", minutes: 1, required: false },
  { name: "Current Medical List", minutes: 2, required: false },
  { name: "Mental Health History", minutes: 2, required: false },
  { name: "Co-pay Agreement", minutes: 1, required: false },
];

const PHQ_SERVICES = ["Medication Management", "Talk Therapy", "Transcranial Magnetic Stimulation (TMS)", "Spravato", "Neuropsychiatric Testing", "ADHD Services", "Other"];

function ProgressBar({ step }: { step: number }) {
  return (
    <div>
      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide mb-2">
        STEP {step} OF {TOTAL_STEPS}
      </p>
      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass = cn(
  "w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700",
  "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
  "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
);

function ContinueButton({ disabled, onClick, children = "Continue" }: { disabled?: boolean; onClick: () => void; children?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
        disabled
          ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-300 dark:text-emerald-800 cursor-not-allowed"
          : "bg-emerald-600 hover:bg-emerald-700 text-white"
      )}
    >
      {children}
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </button>
  );
}

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [accountFor, setAccountFor] = useState<"self" | "guardian" | null>(null);
  const [holder, setHolder] = useState({ firstName: "", lastName: "", relationship: "", mobile: "" });
  const [patient, setPatient] = useState({ firstName: "", lastName: "", preferredName: "", dob: "", sexAtBirth: "", pronouns: "" });
  const [careTypes, setCareTypes] = useState<string[]>([]);
  const [location, setLocation] = useState<string | null>(null);

  const [insuranceSubstep, setInsuranceSubstep] = useState<"choose" | "card">("choose");
  const [payerQuery, setPayerQuery] = useState("");
  const [payer, setPayer] = useState<string | null>(null);
  const [cardFront, setCardFront] = useState(false);
  const [cardBack, setCardBack] = useState(false);
  const [cardHolderRel, setCardHolderRel] = useState("");
  const [insFirst, setInsFirst] = useState("");
  const [insLast, setInsLast] = useState("");
  const [insDob, setInsDob] = useState("");
  const [memberId, setMemberId] = useState("");

  const [openForm, setOpenForm] = useState<string | null>(null);
  const [phqServices, setPhqServices] = useState<string[]>([]);
  const [pcpName, setPcpName] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [pcpPhone, setPcpPhone] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");

  function back() {
    if (openForm) { setOpenForm(null); return; }
    if (step === 5 && insuranceSubstep === "card") { setInsuranceSubstep("choose"); return; }
    setStep((s) => Math.max(1, s - 1));
  }

  function pickAccountFor(kind: "self" | "guardian") {
    setAccountFor(kind);
    const newId = createSubmission(kind);
    setSubmissionId(newId);
    if (kind === "self") setHolder((h) => ({ ...h, relationship: "Self" }));
    setStep(2);
  }

  function continueStep2() {
    if (!submissionId) return;
    const data: AccountHolder = { ...holder, relationship: holder.relationship || "Self" };
    submitAccountHolder(submissionId, data);
    if (accountFor === "self") {
      setPatient((p) => ({ ...p, firstName: holder.firstName, lastName: holder.lastName }));
    }
    setStep(3);
  }

  function continueStep3() {
    if (!submissionId) return;
    const data: PatientIdentity = { ...patient };
    submitPatientInfo(submissionId, data);
    setStep(4);
  }

  function continueStep4(skipped: boolean) {
    if (!submissionId) return;
    submitCareIntent(submissionId, { careTypes: skipped ? [] : careTypes, location: skipped ? undefined : (location ?? undefined), skipped });
    setStep(5);
  }

  function choosePayer(name: string) {
    setPayer(name);
    setInsuranceSubstep("card");
  }

  function continueInsurance() {
    if (!submissionId || !payer) return;
    const data: InsuranceSubmission = {
      payerName: payer,
      cardFrontUploaded: cardFront,
      cardBackUploaded: cardBack,
      relationshipToCardholder: cardHolderRel || "Self",
      cardholderFirstName: insFirst,
      cardholderLastName: insLast,
      cardholderDob: insDob,
      memberId,
    };
    submitInsurance(submissionId, data);
    setStep(6);
  }

  function toggleCareType(t: string) {
    setCareTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function togglePhqService(t: string) {
    setPhqServices((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function submitRequiredForm() {
    if (!submissionId) return;
    completeForms(submissionId, ["Patient Health Information"]);
    setDone(true);
  }

  const step2Valid = holder.firstName.trim() && holder.lastName.trim();
  const step3Valid = patient.firstName.trim() && patient.lastName.trim() && patient.dob.trim();
  const step5Valid = cardFront && cardBack && insFirst.trim() && insLast.trim() && insDob.trim() && memberId.trim();

  const filteredPayers = PAYERS.filter((p) => p.toLowerCase().includes(payerQuery.toLowerCase()));

  const showBack = step > 1 || openForm;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-start sm:items-center justify-center sm:p-6">
      <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 sm:rounded-3xl sm:shadow-xl sm:border sm:border-slate-200 dark:sm:border-slate-800 min-h-screen sm:min-h-0 flex flex-col">
        {/* Header */}
        {!done && (
          <div className="px-6 pt-6 pb-2 shrink-0">
            <div className="flex items-center justify-between mb-5">
              {showBack ? (
                <button onClick={back} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 -ml-1 p-1">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : <span />}
              {openForm && (
                <button
                  onClick={submitRequiredForm}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <Check className="w-3.5 h-3.5" /> Submit
                </button>
              )}
            </div>
            {!openForm && <ProgressBar step={step} />}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 px-6 pb-8 overflow-y-auto">
          {done && (
            <div className="flex flex-col items-center text-center pt-16">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">You&apos;re all set!</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                We&apos;ve received your information and submitted your insurance for eligibility verification.
                Your care coordinator has been notified and will reach out once coverage is confirmed.
              </p>
              <Link href="/patient/home" className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                Go to Patient Portal
              </Link>
              <Link href="/onboarding" className="mt-4 text-xs text-slate-400 hover:text-slate-600">
                Start another onboarding (demo)
              </Link>
            </div>
          )}

          {!done && openForm === "Patient Health Information" && (
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Patient Health Information</h1>
              <p className="text-xs font-medium text-amber-600 mb-4">Intake Form</p>

              <div className="mb-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Penfield Psychiatry</p>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">This intake form helps us understand your needs, background, and goals before your first session.</p>
                </div>
              </div>

              <div className="mb-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">Service and Healthcare Information</div>

              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-4 mb-2">1. What services are you interested in? (Select all that apply) *</p>
              <div className="space-y-2 mb-5">
                {PHQ_SERVICES.map((svc) => (
                  <label key={svc} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={phqServices.includes(svc)} onChange={() => togglePhqService(svc)} className="w-4 h-4 rounded accent-emerald-600" />
                    {svc}
                  </label>
                ))}
              </div>

              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Primary Care Provider</p>
              <div className="space-y-3 mb-5">
                <input value={pcpName} onChange={(e) => setPcpName(e.target.value)} placeholder="Provider Name" className={inputClass} />
                <input value={practiceName} onChange={(e) => setPracticeName(e.target.value)} placeholder="Practice Name" className={inputClass} />
                <input value={pcpPhone} onChange={(e) => setPcpPhone(e.target.value)} placeholder="Contact Number" className={inputClass} />
              </div>

              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Pharmacy Information</p>
              <input value={pharmacyName} onChange={(e) => setPharmacyName(e.target.value)} placeholder="Pharmacy Name" className={inputClass} />
            </div>
          )}

          {!done && !openForm && step === 1 && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1.5">Who is this account for?</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">This helps us tailor the care experience.</p>
              <div className="space-y-4">
                <button onClick={() => pickAccountFor("self")} className="w-full text-left p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition-colors flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><User className="w-5 h-5 text-slate-500" /></div>
                  <div>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100">I&apos;m seeking care for myself</p>
                    <p className="text-sm text-slate-400 mt-0.5">Adults 18 or older managing their own care</p>
                  </div>
                </button>
                <button onClick={() => pickAccountFor("guardian")} className="w-full text-left p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition-colors flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><Users className="w-5 h-5 text-slate-500" /></div>
                  <div>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100">I&apos;m a guardian or caregiver</p>
                    <p className="text-sm text-slate-400 mt-0.5">Parent, legal guardian, power of attorney, or authorized caregiver for someone else.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {!done && !openForm && step === 2 && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1.5">Your information</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">As the responsible adult on this account, we need your details for consent and verification.</p>
              <div className="mb-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  We&apos;ll collect the patient&apos;s details next. Upload signed consent / POA in Records → Documents after onboarding.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Field label="Your First Name *"><input value={holder.firstName} onChange={(e) => setHolder({ ...holder, firstName: e.target.value })} placeholder="First Name" className={inputClass} /></Field>
                <Field label="Last Name *"><input value={holder.lastName} onChange={(e) => setHolder({ ...holder, lastName: e.target.value })} placeholder="Last Name" className={inputClass} /></Field>
              </div>
              {accountFor === "guardian" && (
                <div className="mb-4">
                  <Field label="Relationship to Patient">
                    <select value={holder.relationship} onChange={(e) => setHolder({ ...holder, relationship: e.target.value })} className={inputClass}>
                      <option value="">Select an option</option>
                      {RELATIONSHIPS.filter((r) => r !== "Self").map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>
                </div>
              )}
              <div className="mb-2">
                <Field label="Mobile Number">
                  <input value={holder.mobile} onChange={(e) => setHolder({ ...holder, mobile: e.target.value })} placeholder="(415) 555-0142" className={inputClass} />
                </Field>
                <p className="text-xs text-slate-400 mt-1.5 mb-5">We&apos;ll send appointment reminders and secure-message alerts here.</p>
              </div>
              <ContinueButton disabled={!step2Valid} onClick={continueStep2} />
            </div>
          )}

          {!done && !openForm && step === 3 && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1.5">About the patient</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Please enter information exactly as it appears on a government-issued ID.</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Field label="First Name *"><input value={patient.firstName} onChange={(e) => setPatient({ ...patient, firstName: e.target.value })} placeholder="John" className={inputClass} /></Field>
                <Field label="Last Name *"><input value={patient.lastName} onChange={(e) => setPatient({ ...patient, lastName: e.target.value })} placeholder="Doe" className={inputClass} /></Field>
              </div>
              <div className="mb-4">
                <Field label="Preferred Name (optional)"><input value={patient.preferredName} onChange={(e) => setPatient({ ...patient, preferredName: e.target.value })} placeholder="If different from above" className={inputClass} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Field label="DOB *"><input value={patient.dob} onChange={(e) => setPatient({ ...patient, dob: e.target.value })} placeholder="mm/dd/yyyy" className={inputClass} /></Field>
                <Field label="Sex at Birth">
                  <select value={patient.sexAtBirth} onChange={(e) => setPatient({ ...patient, sexAtBirth: e.target.value })} className={inputClass}>
                    <option value="">Select</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Intersex</option>
                  </select>
                </Field>
              </div>
              <div className="mb-6">
                <Field label="Pronouns (optional)">
                  <select value={patient.pronouns} onChange={(e) => setPatient({ ...patient, pronouns: e.target.value })} className={inputClass}>
                    <option value="">Select an option</option>
                    <option>He/Him</option>
                    <option>She/Her</option>
                    <option>They/Them</option>
                  </select>
                </Field>
              </div>
              <ContinueButton disabled={!step3Valid} onClick={continueStep3} />
            </div>
          )}

          {!done && !openForm && step === 4 && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1.5">What brings you here?</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Select what applies. You can skip and edit any time — we won&apos;t share this with anyone outside your care team.</p>

              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Type of Care</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {CARE_TYPES.map((t) => (
                  <button key={t} onClick={() => toggleCareType(t)}
                    className={cn("px-3.5 py-2 rounded-full text-sm font-medium transition-colors",
                      careTypes.includes(t) ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700")}>
                    {t}
                  </button>
                ))}
              </div>

              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Preferred Location</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {LOCATIONS.map((loc) => {
                  const Icon = loc.icon;
                  const active = location === loc.id;
                  return (
                    <button key={loc.id} onClick={() => setLocation(loc.id)}
                      className={cn("text-left p-3 rounded-xl border flex items-start gap-2 transition-colors",
                        active ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-slate-200 dark:border-slate-700 hover:border-emerald-300")}>
                      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", active ? "text-emerald-600" : "text-slate-400")} />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{loc.name}</p>
                        <p className="text-xs text-slate-400">{loc.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <ContinueButton disabled={false} onClick={() => continueStep4(false)} />
              <button onClick={() => continueStep4(true)} className="w-full text-center mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-700">
                Skip — I&apos;ll fill this in later
              </button>
            </div>
          )}

          {!done && !openForm && step === 5 && insuranceSubstep === "choose" && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1.5">Choose your insurance</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">We&apos;ll verify your benefits while you finish your forms — that gets you to a visit faster.</p>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={payerQuery} onChange={(e) => setPayerQuery(e.target.value)} placeholder="Search insurers" className={cn(inputClass, "pl-9")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {filteredPayers.map((p) => (
                  <button key={p} onClick={() => choosePayer(p)} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition-colors text-center">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{p}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!done && !openForm && step === 5 && insuranceSubstep === "card" && payer && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1.5">Add your insurance card</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">We&apos;ll run a benefits check now so there are no surprises at your visit.</p>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-5">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{payer}</p>
                  <p className="text-xs text-slate-400">Primary Insurance</p>
                </div>
                <button onClick={() => setInsuranceSubstep("choose")} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Change</button>
              </div>

              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Scan Your Card</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {(["Front", "Back"] as const).map((side) => {
                  const uploaded = side === "Front" ? cardFront : cardBack;
                  return (
                    <button key={side}
                      onClick={() => (side === "Front" ? setCardFront(true) : setCardBack(true))}
                      className={cn("rounded-xl border-2 border-dashed p-4 flex flex-col items-center gap-2 transition-colors",
                        uploaded ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/10" : "border-slate-300 dark:border-slate-600 hover:border-emerald-400")}>
                      {uploaded ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">filename.pdf</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-slate-400" />
                          <span className="text-xs text-slate-500">{side}</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mb-4">
                <Field label="Relationship with Card Holder">
                  <select value={cardHolderRel} onChange={(e) => setCardHolderRel(e.target.value)} className={inputClass}>
                    <option value="">Select an option</option>
                    {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Field label="First Name *"><input value={insFirst} onChange={(e) => setInsFirst(e.target.value)} placeholder="John" className={inputClass} /></Field>
                <Field label="Last Name *"><input value={insLast} onChange={(e) => setInsLast(e.target.value)} placeholder="Doe" className={inputClass} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Field label="DOB *"><input value={insDob} onChange={(e) => setInsDob(e.target.value)} placeholder="mm/dd/yyyy" className={inputClass} /></Field>
                <Field label="Member ID"><input value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="Member ID" className={inputClass} /></Field>
              </div>
              <ContinueButton disabled={!step5Valid} onClick={continueInsurance} />
            </div>
          )}

          {!done && !openForm && step === 6 && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1.5">A few quick forms</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">These help your provider prepare for your first visit. You can save and return any time.</p>
              <div className="space-y-2.5">
                {FORMS.map((f) => (
                  <button
                    key={f.name}
                    disabled={!f.required}
                    onClick={() => f.required && setOpenForm(f.name)}
                    className={cn("w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors",
                      f.required ? "border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/10 hover:border-amber-400" : "border-slate-200 dark:border-slate-700 opacity-70 cursor-default")}
                  >
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", f.required ? "bg-amber-100 dark:bg-amber-950/40" : "bg-slate-100 dark:bg-slate-800")}>
                      <FileText className={cn("w-4 h-4", f.required ? "text-amber-600" : "text-slate-400")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{f.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> ~{f.minutes} minutes · {f.required ? <span className="text-amber-600 font-medium">Required</span> : "Optional"}</p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 text-center mt-6">Optional forms can be completed later from Records → Forms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
