import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Care Coordinator",
  description: "PractMD Care Coordinator Portal",
};

export default function CareCoordinatorRouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
