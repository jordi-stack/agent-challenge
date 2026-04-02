"use client";

import { IconSidebar } from "./icon-sidebar";
import { BottomNav } from "./bottom-nav";

export function NavShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IconSidebar />
      <BottomNav />
      <main className="relative z-10 md:ml-[60px] pb-[60px] md:pb-0 min-h-screen p-4 md:p-8">
        {children}
      </main>
    </>
  );
}
