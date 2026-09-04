"use client";

import { useState } from "react";
import { Code2, Copy, Check, RefreshCw } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

type Step = "configure" | "customize" | "embed";

const VISIT_TYPES = ["Initial Consultation", "Follow-Up", "Therapy Session", "Medication Check"];
const PROVIDERS = ["All Providers", "Dr. Sarah Mitchell", "Dr. James O'Brien", "Lisa Nguyen, LCSW"];
const LOCATIONS = ["All Locations", "Penfield Psychiatry", "New Hartford Psychological Services"];

interface SavedEmbed {
  id: string;
  visitType: string;
  provider: string;
  location: string;
  primaryColor: string;
  title: string;
  buttonText: string;
}

const SAVED_EMBEDS: SavedEmbed[] = [
  { id: "pe_abc123", visitType: "Initial Consultation", provider: "All Providers", location: "Penfield Psychiatry", primaryColor: "#3b82f6", title: "Book an Appointment", buttonText: "Book Now" },
  { id: "pe_def456", visitType: "Follow-Up", provider: "Dr. Sarah Mitchell", location: "All Locations", primaryColor: "#8b5cf6", title: "Schedule Follow-Up", buttonText: "Schedule Now" },
];

export default function WebEmbedsScreen() {
  const [step, setStep] = useState<Step>("configure");
  const [config, setConfig] = useState({
    visitType: "Initial Consultation",
    provider: "All Providers",
    location: "All Locations",
    buttonText: "Book Appointment",
    primaryColor: "#3b82f6",
    showProviderBio: true,
    title: "Book an Appointment",
  });
  const [copied, setCopied] = useState(false);
  const [copiedEmbedId, setCopiedEmbedId] = useState<string | null>(null);

  const embedId = "pe_" + btoa(config.visitType + config.provider).replace(/[^a-z0-9]/gi, "").slice(0, 12);

  const embedCode = `<!-- PractMD Booking Widget -->
<div id="${embedId}"></div>
<script src="https://embed.practmd.com/widget.js"
  data-embed-id="${embedId}"
  data-visit-type="${config.visitType}"
  data-provider="${config.provider}"
  data-location="${config.location}"
  data-primary-color="${config.primaryColor}"
  data-title="${config.title}"
  data-button-text="${config.buttonText}">
</script>`;

  function handleCopy() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCopyEmbed(embed: SavedEmbed) {
    const code = `<!-- PractMD Booking Widget -->
<div id="${embed.id}"></div>
<script src="https://embed.practmd.com/widget.js"
  data-embed-id="${embed.id}"
  data-visit-type="${embed.visitType}"
  data-provider="${embed.provider}"
  data-location="${embed.location}"
  data-primary-color="${embed.primaryColor}"
  data-title="${embed.title}"
  data-button-text="${embed.buttonText}">
</script>`;
    navigator.clipboard.writeText(code);
    setCopiedEmbedId(embed.id);
    setTimeout(() => setCopiedEmbedId(null), 2000);
  }

  const STEPS: { id: Step; label: string }[] = [
    { id: "configure", label: "1. Configure" },
    { id: "customize", label: "2. Customize" },
    { id: "embed", label: "3. Get Code" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
          <Code2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Web Embeds</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Generate an embeddable booking widget for your website in three steps.</p>
        </div>
      </div>

      {/* Existing Embeds */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Existing Embeds</h2>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">ID</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Visit Type</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Provider</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Location</th>
                <th className="py-3 px-4 w-28" />
              </tr>
            </thead>
            <tbody>
              {SAVED_EMBEDS.map(embed => (
                <tr key={embed.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{embed.id}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{embed.visitType}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{embed.provider}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{embed.location}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleCopyEmbed(embed)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                        copiedEmbedId === embed.id
                          ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}>
                      {copiedEmbedId === embed.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedEmbedId === embed.id ? "Copied!" : "Copy Code"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Embed */}
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Create New Embed</h2>

      {/* Step tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {STEPS.map(s => (
          <button key={s.id} onClick={() => setStep(s.id)}
            className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              step === s.id ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300")}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Step 1: Configure */}
      {step === "configure" && (
        <div className="space-y-4">
          {[
            { key: "visitType", label: "Visit Type", options: VISIT_TYPES },
            { key: "provider", label: "Provider", options: PROVIDERS },
            { key: "location", label: "Location", options: LOCATIONS },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
              <select value={config[f.key as keyof typeof config] as string} onChange={e => setConfig(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <button onClick={() => setStep("customize")} className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
            Next: Customize →
          </button>
        </div>
      )}

      {/* Step 2: Customize */}
      {step === "customize" && (
        <div className="space-y-4">
          {[
            { key: "title", label: "Widget Title", placeholder: "Book an Appointment" },
            { key: "buttonText", label: "Button Text", placeholder: "Book Appointment" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
              <input value={config[f.key as keyof typeof config] as string} onChange={e => setConfig(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Primary Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={config.primaryColor} onChange={e => setConfig(p => ({ ...p, primaryColor: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer" />
              <span className="text-sm font-mono text-slate-600 dark:text-slate-400">{config.primaryColor}</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Show Provider Bio</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Display provider photo and bio in the widget</p>
            </div>
            <Toggle checked={config.showProviderBio} onChange={v => setConfig(p => ({ ...p, showProviderBio: v }))} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep("configure")} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">← Back</button>
            <button onClick={() => setStep("embed")} className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Get Code →</button>
          </div>
        </div>
      )}

      {/* Step 3: Embed code */}
      {step === "embed" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 space-y-1">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Widget Preview</p>
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 p-3 bg-white dark:bg-slate-900 text-sm">
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{config.title}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                <p>Visit Type: {config.visitType}</p>
                <p>Provider: {config.provider}</p>
                <p>Location: {config.location}</p>
              </div>
              <button className="mt-3 px-4 py-1.5 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: config.primaryColor }}>
                {config.buttonText}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Embed Code</label>
              <button onClick={handleCopy} className={cn("flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium transition-colors",
                copied ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-900 dark:bg-slate-950 text-green-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{embedCode}</pre>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
            Paste this code anywhere in your website&apos;s HTML where you want the booking widget to appear. The widget is responsive and adapts to any container width.
          </div>

          <button onClick={() => setStep("configure")} className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" /> Create Another Embed
          </button>
        </div>
      )}
    </div>
  );
}
