"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";

interface ReportDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  confidence?: number;
  probes?: { label: string; color: string }[];
}

export function ReportDrawer({ open, onClose, title, content, confidence, probes }: ReportDrawerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="relative w-full max-w-3xl max-h-[85vh] bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--card-border)] rounded-2xl flex flex-col overflow-hidden"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top accent line */}
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />

              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--card-border)] flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-white">{title}</h2>
                  {probes && (
                    <div className="flex items-center gap-3 mt-1.5">
                      {probes.map((p) => (
                        <span key={p.label} className="flex items-center gap-1 text-[10px]" style={{ color: p.color }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {confidence !== undefined && (
                  <span className="text-xs px-3 py-1 rounded-full border flex-shrink-0" style={{ borderColor: "var(--success)", color: "var(--success)", backgroundColor: "rgba(34,197,94,0.1)" }}>
                    {confidence}%
                  </span>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <MarkdownRenderer content={content} />
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-[var(--card-border)] flex-shrink-0">
                <p className="text-[10px] text-[var(--muted)]">
                  PROBE Intelligence Report
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
