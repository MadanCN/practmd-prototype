"use client";

import { createContext, useContext } from "react";

/** The 360° patient chart is shared between the Provider and Care Coordinator
 *  portals. This context carries the portal's route prefix so back-links and
 *  patient-to-patient links resolve to the right place. */
const ChartBaseContext = createContext<string>("/provider");

export function ChartBaseProvider({ base, children }: { base: string; children: React.ReactNode }) {
  return <ChartBaseContext.Provider value={base}>{children}</ChartBaseContext.Provider>;
}

/** e.g. "/provider" or "/care-coordinator". Use `${useChartBase()}/patients/<id>`. */
export function useChartBase() {
  return useContext(ChartBaseContext);
}
