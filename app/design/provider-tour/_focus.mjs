import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const SK = "C:/Users/Acht/AppData/Local/Temp/claude/bundled-skills/2.1.243/8e3d4e6246d3cae39dbb4ab1daffa20d/design";
const file = process.argv[2];
const orig = readFileSync("canvas.json", "utf8");
const j = JSON.parse(orig);
j.launch = file ? { view: "focused", file } : { view: "canvas", page: "tours" };
writeFileSync("canvas.json", JSON.stringify(j, null, 2));
const boards = ["Main","Calendar","List","EncounterNotes","WaitingRoom","Messages","Patients","Tasks","Reports","Recents","Availability","Settings","Profile","Spec"];
const args = [`${SK}/seed-canvas.mjs`, "--template", `${SK}/payload.template.html`, "--out", "tour-preview.html", "--title", "Provider Onboarding Tour"];
for (const bd of boards) args.push("--artboard", `${bd}.dc.html`);
args.push("--canvas", "canvas.json");
try { console.log(execFileSync("node", args, { encoding: "utf8" })); }
finally { writeFileSync("canvas.json", orig); }
