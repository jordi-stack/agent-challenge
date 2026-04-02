"use client";

import { Search, Send, Loader2 } from "lucide-react";

interface SearchPillProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  placeholder?: string;
}

export function SearchPill({ value, onChange, onSubmit, loading, placeholder }: SearchPillProps) {
  return (
    <div className="max-w-2xl mx-auto relative">
      {/* Outer glow */}
      <div className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-[var(--accent)]/20 via-transparent to-[var(--accent)]/20 blur-sm pointer-events-none" />
      <div className="relative flex items-center bg-[var(--card)]/90 backdrop-blur-xl border border-[var(--card-border)] rounded-full px-5 py-3.5 focus-within:border-[var(--accent)]/50 transition-all focus-within:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
        <Search className="w-4 h-4 text-[var(--accent)] mr-3 flex-shrink-0 opacity-60" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder={placeholder || "Enter a Web3 topic to investigate..."}
          className="flex-1 bg-transparent text-white placeholder-[var(--muted)] outline-none text-sm"
          disabled={loading}
        />
        <button
          onClick={onSubmit}
          disabled={!value.trim() || loading}
          className="ml-3 w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
