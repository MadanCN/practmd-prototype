"use client";

import { useMemo } from "react";
import { Copy, Download } from "lucide-react";
import { buildRecap } from "@/lib/product/recap";
import { downloadText } from "@/lib/product/csv";
import type { Challenge, ChallengeCategory, ChallengeNote } from "@/lib/product/data/challenges";
import { Button, Dialog } from "@/components/product/ui/primitives";
import { useToast } from "@/components/product/ui/Toast";

export default function RecapDialog({
  onClose,
  categories,
  challenges,
  notes,
}: {
  onClose: () => void;
  categories: ChallengeCategory[];
  challenges: Challenge[];
  notes: ChallengeNote[];
}) {
  const toast = useToast();
  const markdown = useMemo(() => buildRecap(categories, challenges, notes), [categories, challenges, notes]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      toast("Recap copied to the clipboard");
    } catch {
      toast("Couldn't copy — select the text and copy it instead.", "error");
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Workshop recap"
      width="max-w-3xl"
      footer={
        <>
          <Button onClick={() => downloadText(`practmd-challenges-recap-${new Date().toISOString().slice(0, 10)}.md`, markdown, "text/markdown")}>
            <Download className="h-4 w-4" /> Download .md
          </Button>
          <Button variant="primary" onClick={copy} data-autofocus>
            <Copy className="h-4 w-4" /> Copy to clipboard
          </Button>
        </>
      }
    >
      <p className="mb-2 text-sm text-pm-muted">Every category&apos;s challenges with status, ask, advice (with source), decisions and actions.</p>
      <textarea readOnly aria-label="Recap markdown" value={markdown} className="h-[55vh] w-full resize-none rounded-lg border border-pm-border bg-pm-subtle p-3 font-mono text-xs leading-relaxed" />
    </Dialog>
  );
}
