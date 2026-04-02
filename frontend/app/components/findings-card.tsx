"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface FindingsCardProps {
  type: "scout" | "analyst" | "sentinel";
  label: string;
  color: string;
  findings: string;
  confidence: number;
  onClick: () => void;
  delay?: number;
}

export function FindingsCard({ type, label, color, findings, confidence, onClick, delay = 0 }: FindingsCardProps) {
  const preview = findings.replace(/[#*_\[\]]/g, "").slice(0, 140);

  return (
    <motion.button
      onClick={onClick}
      className="relative overflow-hidden text-left w-full rounded-2xl border transition-all group cursor-pointer bg-[var(--card)]/80 backdrop-blur-xl hover:scale-[1.02] active:scale-[0.98]"
      style={{ borderColor: `${color}20` }}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ borderColor: `${color}50` }}
    >
      {/* Top accent line */}
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <div className="absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-30" style={{ backgroundColor: color }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
            {label}
          </span>
          <span
            className="ml-auto text-[10px] px-2.5 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}25` }}
          >
            {confidence}%
          </span>
        </div>

        {/* Preview text */}
        <p className="text-xs text-[var(--foreground)] leading-relaxed opacity-70 line-clamp-3 mb-4">
          {preview}...
        </p>

        {/* Click hint */}
        <div className="flex items-center gap-1.5 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-all" style={{ color }}>
          <span>View full report</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>

      {/* Bottom corner glow */}
      <div
        className="absolute bottom-0 right-0 w-32 h-32 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-tl-full"
        style={{ background: color }}
      />
    </motion.button>
  );
}
