"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Cpu, BarChart3, Shield, Merge, Globe } from "lucide-react";

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: Search,
    label: "1. Topic Input",
    color: "#10b981",
    description: "You enter a Web3 topic to investigate. The system sends it to the ElizaOS agent running on Nosana's decentralized GPU network.",
  },
  {
    icon: Cpu,
    label: "2. Commander Decomposes",
    color: "#10b981",
    description: "The Commander module breaks your topic into 3 specialized sub-queries, each tailored for a different probe's focus area.",
  },
  {
    icon: Globe,
    label: "3. Web Search",
    color: "#22d3ee",
    description: "Each probe runs focused Tavily web searches to gather real-time data: news articles, pricing data, community discussions, and documentation.",
  },
  {
    icon: Search,
    label: "4. Scout Probe",
    color: "#22d3ee",
    description: "Analyzes web search results to extract factual findings: official announcements, technical architecture, partnerships, and recent developments. Cites sources with URLs.",
  },
  {
    icon: BarChart3,
    label: "5. Analyst Probe",
    color: "#a78bfa",
    description: "Extracts quantitative data from search results: token prices, market caps, GPU pricing comparisons, network metrics, and growth statistics.",
  },
  {
    icon: Shield,
    label: "6. Sentinel Probe",
    color: "#f59e0b",
    description: "Gauges community sentiment from web discussions: developer opinions, social buzz, criticisms, praise, and ecosystem health signals.",
  },
  {
    icon: Merge,
    label: "7. Synthesizer",
    color: "#10b981",
    description: "Merges all probe findings into a structured Intelligence Briefing with executive summary, key findings, risk assessment, opportunities, and confidence score.",
  },
];

export function HowItWorksModal({ open, onClose }: HowItWorksModalProps) {
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
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-2xl max-h-[85vh] bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--card-border)] rounded-2xl flex flex-col overflow-hidden"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />

              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--card-border)] flex-shrink-0">
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-white">How PROBE Works</h2>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5">Multi-agent research swarm powered by ElizaOS + Nosana</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-1">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex gap-4"
                    >
                      {/* Timeline */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${step.color}15`, border: `1px solid ${step.color}30` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: step.color }} />
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className="w-px flex-1 min-h-[24px] my-1" style={{ backgroundColor: `${step.color}20` }} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="pb-5">
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: step.color }}>
                          {step.label}
                        </p>
                        <p className="text-[12px] text-[var(--foreground)] opacity-70 mt-1 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Tech stack footer */}
                <div className="pt-4 border-t border-[var(--card-border)]">
                  <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-2">Tech Stack</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["ElizaOS v2", "Nosana GPU", "Qwen3.5-4B", "Tavily Search", "Next.js 16", "Solana"].map((tech) => (
                      <span key={tech} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/8 text-[var(--accent)] border border-[var(--accent)]/15">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-[var(--card-border)] flex-shrink-0">
                <p className="text-[10px] text-[var(--muted)]">
                  PROBE v1.0 // Nosana x ElizaOS Agent Challenge
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
