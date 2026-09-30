import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ProductProviders from "@/components/product/ProductProviders";
import { cn } from "@/lib/utils";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PractMD Product — Roadmap, Priorities and Challenges",
  description: "Rank, plan and track PractMD roadmap work, and capture workshop challenges.",
};

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(inter.variable, "product-app flex min-h-full flex-col overflow-x-hidden bg-pm-bg text-pm-text")}>
      <ProductProviders>{children}</ProductProviders>
      {/* Sheets, dialogs and popovers portal here so they inherit the theme tokens and font. */}
      <div id="product-portal" />
    </div>
  );
}
