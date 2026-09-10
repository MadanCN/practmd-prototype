"use client";
import GmSimpleTable, { type ExtraColumn } from "@/components/global-masters/GmSimpleTable";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReferralItem {
  id: string;
  name: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
  [key: string]: unknown;
}

const CATEGORIES = [
  { label: "Digital", value: "digital" },
  { label: "Provider", value: "provider" },
  { label: "Word of Mouth", value: "word_of_mouth" },
  { label: "Insurance", value: "insurance" },
  { label: "Community", value: "community" },
  { label: "Other", value: "other" },
];

const CATEGORY_COLORS: Record<string, string> = {
  digital: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400",
  provider: "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400",
  word_of_mouth: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
  insurance: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400",
  community: "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400",
  other: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
};

const SEED: ReferralItem[] = [
  { id: "1", name: "Google Search", category: "digital", displayOrder: 1, isActive: true },
  { id: "2", name: "Social Media", category: "digital", displayOrder: 2, isActive: true },
  { id: "3", name: "Physician Referral", category: "provider", displayOrder: 3, isActive: true },
  { id: "4", name: "Specialist Referral", category: "provider", displayOrder: 4, isActive: true },
  { id: "5", name: "Friend / Family", category: "word_of_mouth", displayOrder: 5, isActive: true },
  { id: "6", name: "Insurance Directory", category: "insurance", displayOrder: 6, isActive: true },
  { id: "7", name: "Psychology Today", category: "digital", displayOrder: 7, isActive: true },
  { id: "8", name: "Community Event", category: "community", displayOrder: 8, isActive: true },
  { id: "9", name: "Other", category: "other", displayOrder: 9, isActive: true },
];

const extraColumns: ExtraColumn<ReferralItem>[] = [
  {
    key: "category",
    label: "Category",
    render: (item) => {
      const cat = CATEGORIES.find(c => c.value === item.category);
      return (
        <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.other)}>
          {cat?.label ?? item.category}
        </span>
      );
    },
  },
];

export default function ReferralSourceScreen() {
  return (
    <GmSimpleTable<ReferralItem>
      title="Referral Sources"
      description="Track how patients discover and are directed to the practice — used in reporting and marketing analysis."
      icon={Share2}
      singularLabel="Referral Source"
      seedData={SEED}
      extraColumns={extraColumns}
      extraFields={[
        {
          key: "category",
          label: "Category",
          type: "select",
          options: CATEGORIES,
          required: true,
        },
      ]}
    />
  );
}
