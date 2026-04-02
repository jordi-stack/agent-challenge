"use client";

import { Settings, Save, Check } from "lucide-react";
import { useState } from "react";
import { useLocalStorage } from "../lib/use-local-storage";
import { FloatingCard } from "../components/floating-card";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const [agentUrl, setAgentUrl] = useLocalStorage("probe-agent-url", "http://localhost:3000");
  const [probeConfig, setProbeConfig] = useLocalStorage("probe-config", {
    scout: true,
    analyst: true,
    sentinel: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleProbe = (probe: "scout" | "analyst" | "sentinel") => {
    setProbeConfig((prev) => ({ ...prev, [probe]: !prev[probe] }));
  };

  const probes = [
    { key: "scout" as const, name: "SCOUT", desc: "Web research and documentation", color: "var(--scout)" },
    { key: "analyst" as const, name: "ANALYST", desc: "Metrics, data, and statistics", color: "var(--analyst)" },
    { key: "sentinel" as const, name: "SENTINEL", desc: "Community sentiment analysis", color: "var(--sentinel)" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="w-7 h-7 text-[var(--accent)]" />
          Settings
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">Configure PROBE behavior</p>
      </div>

      {/* Agent Connection */}
      <FloatingCard>
        <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">
          Agent Connection
        </h2>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-2">
            ElizaOS Agent URL
          </label>
          <input
            type="text"
            value={agentUrl}
            onChange={(e) => setAgentUrl(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
      </FloatingCard>

      {/* Probe Configuration */}
      <FloatingCard>
        <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">
          Probe Configuration
        </h2>
        <div className="space-y-3">
          {probes.map((probe) => (
            <div
              key={probe.key}
              className="flex items-center justify-between py-3 border-b border-[var(--card-border)] last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: probe.color }}
                />
                <div>
                  <p className="text-sm font-medium text-white">{probe.name}</p>
                  <p className="text-xs text-[var(--muted)]">{probe.desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggleProbe(probe.key)}
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  probeConfig[probe.key] ? "bg-[var(--success)]" : "bg-[var(--card-border)]"
                }`}
              >
                <motion.div
                  className="w-4 h-4 rounded-full bg-white absolute top-0.5"
                  animate={{ left: probeConfig[probe.key] ? 22 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          ))}
        </div>
      </FloatingCard>

      {/* About */}
      <FloatingCard>
        <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
          About PROBE
        </h2>
        <div className="text-sm text-[var(--muted)] space-y-1.5">
          <p>Version 1.0.0</p>
          <p>Framework: ElizaOS v2</p>
          <p>Model: Qwen/Qwen3.5-4B</p>
          <p>Infrastructure: Nosana Decentralized GPU Network</p>
          <p className="text-[var(--accent)]">Built for Nosana x ElizaOS Agent Challenge</p>
        </div>
      </FloatingCard>

      {/* Save */}
      <button
        onClick={handleSave}
        className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
      >
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
              <Check className="w-4 h-4" /> Saved
            </motion.span>
          ) : (
            <motion.span key="save" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Settings
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
