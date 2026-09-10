"use client";

import { useState } from "react";
import CcSidebar from "./CcSidebar";
import { Bell, Search, ChevronDown, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function CcLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="h-full flex bg-slate-50 dark:bg-slate-950">
      <CcSidebar />

      {/* Main content — sidebar is 240px collapsed=68px, we handle that via sidebar's own state
          For simplicity, use ml-60 and let sidebar handle its own collapse state */}
      <div className="flex-1 flex flex-col min-h-screen ml-60 transition-[margin] duration-200">
        {/* Header */}
        <header className="fixed top-0 right-0 left-60 z-30 h-[60px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-5 gap-4 transition-[left] duration-200">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input placeholder="Search patients, appointments…" className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none" />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Clinic selector */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="text-base">🌿</span>
              <span className="font-medium">New Hartford</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Notifications */}
            <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>

            {/* Theme */}
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer">
              CC
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pt-[60px] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
