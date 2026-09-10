"use client";

import { use } from "react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { EncounterNoteEditor } from "@/components/provider/encounters/EncounterNoteEditor";

export default function EncounterNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProviderLayout>
      <EncounterNoteEditor id={id} />
    </ProviderLayout>
  );
}
