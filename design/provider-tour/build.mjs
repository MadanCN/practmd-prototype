/* Stamps _template.html + pages.mjs into one <Page>.dc.html per nav page. */
import { readFileSync, writeFileSync } from "node:fs";
import { PAGES } from "./pages.mjs";

const tpl = readFileSync(new URL("./_template.html", import.meta.url), "utf8");
const s = (x) => JSON.stringify(x);

function cfg(p) {
  return [
    `pageName() { return ${s(p.name)}; }`,
    `crumb() { return ${s(p.crumb)}; }`,
    `welcome() { return { title: ${s(p.welcome.title)}, body: ${s(p.welcome.body)} }; }`,
    `steps() { return ${s(p.steps)}; }`,
    `helpIntro() { return ${s(p.helpIntro)}; }`,
    `helpDoc() { return ${s(p.helpDoc)}; }`,
  ].join("\n  ");
}

for (const p of PAGES) {
  let out = tpl;
  if (p.active === "profile") {
    out = out.replace('data-k="profile" class="who"', 'data-k="profile" class="who on"');
  } else {
    out = out.replace(`data-k="${p.active}" class="nav-i"`, `data-k="${p.active}" class="nav-i on"`);
  }
  out = out.replace(/<!--BODY:START-->[\s\S]*?<!--BODY:END-->/, `<!--BODY:START-->\n${p.body.trim()}\n    <!--BODY:END-->`);
  out = out.replace(/\/\*CFG:START\*\/[\s\S]*?\/\*CFG:END\*\//, `/*CFG:START*/\n  ${cfg(p)}\n  /*CFG:END*/`);

  // sanity: every non-help step id must appear in the body
  for (const st of p.steps) {
    if (st.id === "help-btn" || st.id === "nav-badge") continue;
    if (!p.body.includes(`id="${st.id}"`)) console.warn(`  ! ${p.file}: step id "${st.id}" not found in body`);
  }
  writeFileSync(new URL(`./${p.file}`, import.meta.url), out);
  console.log("wrote", p.file);
}
