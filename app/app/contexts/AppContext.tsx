"use client";

import React, { createContext, useContext, useState } from "react";
import { Clinic } from "@/types";

const CLINICS: Clinic[] = [
  { id: "penfield", name: "Penfield Psychiatry", shortName: "PP" },
  { id: "newhartford", name: "New Hartford Psychological Services", shortName: "NHPS" },
];

interface AppContextValue {
  clinics: Clinic[];
  activeClinic: Clinic;
  setActiveClinic: (clinic: Clinic) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeClinic, setActiveClinic] = useState<Clinic>(CLINICS[0]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AppContext.Provider
      value={{ clinics: CLINICS, activeClinic, setActiveClinic, sidebarCollapsed, setSidebarCollapsed }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
