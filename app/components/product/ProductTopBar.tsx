"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { ArrowLeft, Eye, LogOut, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials, useSession } from "@/components/product/SessionContext";
import { PresenceAvatars } from "@/components/product/Presence";
import { Popover } from "@/components/product/ui/primitives";

export const PRODUCT_TABS = [
  { href: "/product/priorities", label: "Priorities" },
  { href: "/product/workstreams", label: "Workstreams" },
  { href: "/product/timeline", label: "Timeline" },
  { href: "/product/challenges", label: "Challenges" },
] as const;

const barButton =
  "flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-pm-aqua";

const noopSubscribe = () => () => {};

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // false during SSR, true on the client — avoids a theme-icon hydration mismatch.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return <div className="h-8 w-8" />;
  const isDark = resolvedTheme === "dark";
  return (
    <button type="button" onClick={() => setTheme(isDark ? "light" : "dark")} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} className={barButton}>
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function UserMenu() {
  const { user } = useSession();
  const name = user.displayName || user.email;
  return (
    <Popover
      label="Account"
      align="right"
      trigger={
        <span className="flex items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-white/10">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pm-teal text-xs font-semibold text-white">{initials(name)}</span>
          <span className="hidden max-w-[200px] truncate text-sm text-white/90 md:inline">{name}</span>
        </span>
      }
    >
      <p className="font-semibold">{user.displayName ?? user.email}</p>
      <p className="text-xs text-pm-muted">{user.email}</p>
      <p className="mt-1 text-xs text-pm-muted">
        Role: <span className="font-medium capitalize text-pm-text">{user.role}</span>
      </p>
      <form action="/product/auth/signout" method="post" className="mt-3 border-t border-pm-border pt-3">
        <button type="submit" className="inline-flex items-center gap-1.5 text-sm font-medium text-pm-link hover:underline">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </form>
    </Popover>
  );
}

function ReadOnlyBadge() {
  const { canEdit } = useSession();
  if (canEdit) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white" title="Viewers can see everything but can't make changes">
      <Eye className="h-3.5 w-3.5" /> View only
    </span>
  );
}

export default function ProductTopBar({ signedIn = false }: { signedIn?: boolean }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 bg-pm-navy text-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="Back to role selection" className={barButton}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Link href="/product/priorities" className="flex items-baseline gap-2 rounded focus-visible:outline-2 focus-visible:outline-pm-aqua">
          <span className="text-lg font-bold tracking-tight">
            Pract<span className="text-pm-aqua">MD</span>
          </span>
          <span className="hidden text-sm font-medium text-white/75 sm:inline">Product</span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {signedIn && <ReadOnlyBadge />}
          {signedIn && <PresenceAvatars className="hidden sm:flex" />}
          <ThemeToggle />
          {signedIn && <UserMenu />}
        </div>
      </div>

      <nav aria-label="Product sections" className="border-t border-white/10 bg-pm-ink">
        <div className="mx-auto flex max-w-[1600px] gap-1 overflow-x-auto px-4 sm:px-6">
          {PRODUCT_TABS.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pm-aqua",
                  active ? "text-white" : "text-white/70 hover:text-white",
                )}
              >
                {tab.label}
                {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-pm-aqua" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
