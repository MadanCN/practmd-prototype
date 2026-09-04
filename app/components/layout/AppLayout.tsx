"use client";

import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useApp();

  return (
    <div className="h-full flex bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-[margin] duration-200 ease-in-out",
          sidebarCollapsed ? "ml-[68px]" : "ml-64"
        )}
      >
        <Header />
        <main className="flex-1 pt-[60px] overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
