import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Provider",
  description: "PractMD Provider Portal",
};

export default function ProviderRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
