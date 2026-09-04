"use client";

import RmSidebar from "./RmSidebar";
import { Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function RmLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="h-full flex bg-slate-50 dark:bg-slate-950">
      <RmSidebar />

      <div className="flex-1 flex flex-col min-h-screen ml-60 transition-[margin] duration-200">
        <header className="fixed top-0 right-0 left-60 z-30 h-[60px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-5 gap-4 transition-[left] duration-200">
          <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Eligibility Worklist</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className={cn("w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer")}>
              RM
            </div>
          </div>
        </header>

        <main className="flex-1 pt-[60px] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
