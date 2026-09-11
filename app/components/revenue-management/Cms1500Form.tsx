"use client";

// Visual reconstruction of the CMS-1500 health insurance claim form (boxes
// 1-33), laid out from a Claim's live-computed Cms1500Data (see
// buildCms1500() in lib/claim-store.ts). Not a byte-for-byte replica of the
// NUCC-approved print layout — a legible, boxed facsimile good enough for a
// biller to sanity-check what would go out on the wire, with a print button
// for the "export" gesture. Shared by the Revenue Cycle claim detail view
// and the patient's Billing tab (read-only there).

import { Printer } from "lucide-react";
import type { Cms1500Data } from "@/lib/claim-store";

function Box({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-red-300 dark:border-red-900/60 px-2 py-1.5 ${className ?? ""}`}>
      <p className="text-[8px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wide leading-none">{label}</p>
      <p className="text-[11px] text-slate-800 dark:text-slate-200 mt-1 break-words min-h-[14px]">{value || " "}</p>
    </div>
  );
}

export default function Cms1500Form({ data, printId }: { data: Cms1500Data; printId?: string }) {
  return (
    <div id={printId} className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex items-center justify-between mb-3 print:hidden">
        <div>
          <p className="text-sm font-bold">HEALTH INSURANCE CLAIM FORM</p>
          <p className="text-[10px] text-slate-400">Approved by National Uniform Claim Committee (NUCC) — form CMS-1500</p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
          <Printer className="w-3.5 h-3.5" /> Print / Export
        </button>
      </div>

      <div className="border-2 border-red-400 dark:border-red-900 rounded-md overflow-hidden text-[11px]">
        {/* Row: insurance type + insured ID */}
        <div className="grid grid-cols-3">
          <Box label="1. Insurance Type" value={data.box1_insuranceType} />
          <Box label="1a. Insured's ID Number" value={data.box1a_insuredId} />
          <Box label="6. Patient Relationship to Insured" value={data.box6_relationshipToInsured} />
        </div>
        {/* Patient / Insured names */}
        <div className="grid grid-cols-2">
          <Box label="2. Patient's Name" value={data.box2_patientName} />
          <Box label="4. Insured's Name" value={data.box4_insuredName} />
        </div>
        <div className="grid grid-cols-3">
          <Box label="3. Patient Birth Date" value={data.box3_patientDob} />
          <Box label="Sex" value={data.box3_patientSex} />
          <Box label="11a. Insured's DOB / Sex" value={`${data.box11a_insuredDob} · ${data.box11a_insuredSex}`} />
        </div>
        <div className="grid grid-cols-2">
          <Box label="5. Patient's Address" value={data.box5_patientAddress} />
          <Box label="7. Insured's Address" value={data.box7_insuredAddress} />
        </div>
        <div className="grid grid-cols-3">
          <Box label="9. Other Insured's Name" value={data.box9_otherInsuredName || "—"} />
          <Box label="11. Insured's Policy / Group Number" value={data.box11_policyGroupNumber} />
          <Box label="11c. Insurance Plan Name" value={data.box11c_planName} />
        </div>
        <div className="grid grid-cols-2">
          <Box label="14. Date of Current Illness" value={data.box14_dateOfCurrentIllness} />
          <Box label="17 / 17b. Referring Provider / NPI" value={data.box17_referringProvider ? `${data.box17_referringProvider} · ${data.box17b_referringNpi}` : "—"} />
        </div>

        {/* Diagnoses */}
        <div className="border border-red-300 dark:border-red-900/60 px-2 py-1.5">
          <p className="text-[8px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wide leading-none mb-1.5">21. Diagnosis or Nature of Illness or Injury (ICD Ind. {data.box21_icdIndicator})</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-0.5">
            {data.box21_diagnoses.length === 0 && <span className="text-slate-400 text-[11px]">—</span>}
            {data.box21_diagnoses.map((d) => (
              <span key={d.letter} className="text-[11px]"><b>{d.letter}.</b> {d.code} <span className="text-slate-400">— {d.label}</span></span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2">
          <Box label="22. Resubmission Code / Original Ref No." value={data.box22_resubmissionCode || "—"} />
          <Box label="23. Prior Authorization Number" value={data.box23_priorAuthNumber || "—"} />
        </div>

        {/* Service lines */}
        <div className="border border-red-300 dark:border-red-900/60">
          <p className="text-[8px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wide px-2 pt-1.5">24. Service Lines</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] min-w-[560px]">
              <thead>
                <tr className="text-red-700 dark:text-red-400 text-left">
                  <th className="px-2 py-1 font-semibold">A. Date</th>
                  <th className="px-2 py-1 font-semibold">B. POS</th>
                  <th className="px-2 py-1 font-semibold">D. CPT/HCPCS</th>
                  <th className="px-2 py-1 font-semibold">Mod</th>
                  <th className="px-2 py-1 font-semibold">E. Dx</th>
                  <th className="px-2 py-1 font-semibold text-right">F. Charges</th>
                  <th className="px-2 py-1 font-semibold">G. Units</th>
                  <th className="px-2 py-1 font-semibold">J. Rendering NPI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100 dark:divide-red-950/40">
                {data.box24_lines.length === 0 && (
                  <tr><td colSpan={8} className="px-2 py-3 text-center text-slate-400">No service lines</td></tr>
                )}
                {data.box24_lines.map((l, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1 whitespace-nowrap">{l.dateOfService}</td>
                    <td className="px-2 py-1">{l.placeOfService}</td>
                    <td className="px-2 py-1 font-medium">{l.cpt}</td>
                    <td className="px-2 py-1">{l.modifiers || "—"}</td>
                    <td className="px-2 py-1">{l.diagnosisPointer}</td>
                    <td className="px-2 py-1 text-right">{l.charges}</td>
                    <td className="px-2 py-1">{l.units}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{l.renderingProviderNpi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2">
          <Box label="25. Federal Tax ID" value={data.box25_taxId} />
          <Box label="26. Patient Account No." value={data.box26_patientAccountNo} />
        </div>
        <div className="grid grid-cols-3">
          <Box label="27. Accept Assignment" value={data.box27_acceptAssignment ? "Yes" : "No"} />
          <Box label="28. Total Charge" value={`$${data.box28_totalCharge}`} />
          <Box label="29. Amount Paid" value={`$${data.box29_amountPaid}`} />
        </div>
        <div className="grid grid-cols-2">
          <Box label="30. Balance Due" value={`$${data.box30_balanceDue}`} />
          <Box label="31. Signature of Physician / Supplier" value={data.box31_signature} />
        </div>
        <div className="grid grid-cols-2">
          <Box label="32. Service Facility Location / NPI" value={`${data.box32_serviceFacility} · NPI ${data.box32a_facilityNpi}`} />
          <Box label="33. Billing Provider Info & Phone / NPI" value={`${data.box33_billingProvider} · NPI ${data.box33a_billingNpi}`} />
        </div>
      </div>
    </div>
  );
}
