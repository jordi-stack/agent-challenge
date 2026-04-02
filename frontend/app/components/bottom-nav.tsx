"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, History, Eye, Activity, Settings } from "lucide-react";

const nav = [
  { href: "/", label: "Research", icon: Search },
  { href: "/history", label: "History", icon: History },
  { href: "/watchlist", label: "Watchlist", icon: Eye },
  { href: "/infrastructure", label: "Infra", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-[var(--card)]/90 backdrop-blur-xl border-t border-[var(--card-border)] z-50 flex items-center justify-around md:hidden">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
              active
                ? "text-[var(--accent)]"
                : "text-[var(--muted)]"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
            {active && (
              <div className="absolute top-0 w-8 h-[2px] bg-[var(--accent)] rounded-b-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
