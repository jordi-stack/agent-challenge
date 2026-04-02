"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, History, Eye, Activity, Settings, Zap } from "lucide-react";

const nav = [
  { href: "/", label: "Research", icon: Search },
  { href: "/history", label: "History", icon: History },
  { href: "/watchlist", label: "Watchlist", icon: Eye },
  { href: "/infrastructure", label: "Infrastructure", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function IconSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[60px] bg-[var(--card)]/80 backdrop-blur-xl border-r border-[var(--card-border)] flex-col z-50 hidden md:flex">
      {/* Logo */}
      <div className="flex items-center justify-center py-5">
        <div className="w-9 h-9 rounded-lg bg-[var(--accent)] flex items-center justify-center glow-accent">
          <Zap className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-1 px-2 pt-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all group ${
                active
                  ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--accent)] rounded-r-full" />
              )}
              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-[var(--card)] border border-[var(--card-border)] text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex flex-col items-center gap-1 pb-4">
        <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
        <span className="text-[9px] text-[var(--muted)] writing-mode-vertical" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
          Nosana
        </span>
      </div>
    </aside>
  );
}
