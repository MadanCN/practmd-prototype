import { Fragment, type ReactNode } from "react";

// Tiny, safe Markdown subset for notes: **bold**, *italic* / _italic_, "- " and "1. " lists, paragraphs.
// Builds React elements directly — no HTML strings, so note text can never inject markup.

function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) parts.push(<strong key={`${keyPrefix}-${i++}`}>{m[1]}</strong>);
    else parts.push(<em key={`${keyPrefix}-${i++}`}>{m[2] ?? m[3]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/).test(lines[i])) {
        items.push(lines[i].replace(ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/, ""));
        i++;
      }
      const k = key++;
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List key={k} className={ordered ? "ml-5 list-decimal space-y-0.5" : "ml-5 list-disc space-y-0.5"}>
          {items.map((it, j) => (
            <li key={j}>{inline(it, `${k}-${j}`)}</li>
          ))}
        </List>,
      );
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) para.push(lines[i++]);
    const k = key++;
    blocks.push(
      <p key={k}>
        {para.map((p, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {inline(p, `${k}-${j}`)}
          </Fragment>
        ))}
      </p>,
    );
  }
  return <div className={className ?? "space-y-1.5"}>{blocks}</div>;
}
