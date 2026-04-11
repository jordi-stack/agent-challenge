"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, FileText, Info } from "lucide-react";
import { SearchPill } from "./components/search-pill";
import { ProbeNodeGraph } from "./components/probe-node-graph";
import { FindingsCard } from "./components/findings-card";
import { ReportDrawer } from "./components/report-drawer";
import { useDotGrid } from "./components/dot-grid-context";
import { HowItWorksModal } from "./components/how-it-works-modal";
import { motion, AnimatePresence } from "framer-motion";
import { sendToAgent, checkAgentHealth } from "./lib/eliza-client";

const HISTORY_KEY = "probe-history";

type ProbeStatus = "idle" | "searching" | "complete" | "error";

interface ResearchState {
  topic: string;
  scout: ProbeStatus;
  analyst: ProbeStatus;
  sentinel: ProbeStatus;
  synthesizing: boolean;
  report: string | null;
  confidence: number;
  error: string | null;
  mode: "eliza" | null;
}

const PROBES_META = [
  { type: "scout" as const, label: "SCOUT", color: "#22d3ee" },
  { type: "analyst" as const, label: "ANALYST", color: "#a78bfa" },
  { type: "sentinel" as const, label: "SENTINEL", color: "#f59e0b" },
];

export default function ResearchPage() {
  const [input, setInput] = useState("");
  const [state, setState] = useState<ResearchState>({
    topic: "",
    scout: "idle",
    analyst: "idle",
    sentinel: "idle",
    synthesizing: false,
    report: null,
    confidence: 0,
    error: null,
    mode: null,
  });
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerProbe, setDrawerProbe] = useState<string | null>(null);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const { setFlowTarget, setIntensity, setProbeStreams, triggerCompletionBurst } = useDotGrid();
  const agentOnline = useRef<boolean | null>(null);

  // Check agent health on mount
  useEffect(() => {
    checkAgentHealth().then((ok) => {
      agentOnline.current = ok;
    });
  }, []);

  // Control dot grid flow based on probe activity
  const anyActive =
    state.scout === "searching" ||
    state.analyst === "searching" ||
    state.sentinel === "searching" ||
    state.synthesizing;

  useEffect(() => {
    if (anyActive) {
      setFlowTarget({ x: window.innerWidth / 2, y: window.innerHeight * 0.4 });
      setIntensity(0.8);

      // Send probe positions and active states to dot grid for color streams
      const w = window.innerWidth;
      const h = window.innerHeight;
      setProbeStreams([
        { x: w * 0.18, y: h * 0.15, color: { r: 34, g: 211, b: 238 }, active: state.scout === "searching" },
        { x: w * 0.82, y: h * 0.15, color: { r: 167, g: 139, b: 250 }, active: state.analyst === "searching" },
        { x: w * 0.5, y: h * 0.75, color: { r: 245, g: 158, b: 11 }, active: state.sentinel === "searching" },
      ]);
    } else {
      setIntensity(0);
      setProbeStreams([]);
      const timer = setTimeout(() => setFlowTarget(null), 500);
      return () => clearTimeout(timer);
    }
  }, [anyActive, state.scout, state.analyst, state.sentinel, setFlowTarget, setIntensity, setProbeStreams]);

  /** ElizaOS agent mode: send topic, agent runs probes server-side */
  const researchViaAgent = useCallback(
    async (topic: string) => {
      setState((s) => ({
        ...s,
        topic,
        scout: "idle",
        analyst: "idle",
        sentinel: "idle",
        synthesizing: false,
        report: null,
        confidence: 0,
        error: null,
        mode: "eliza",
      }));

      // Timed simulation of probe progress while agent works server-side.
      // Matches real action timing: commander(5s) + scout(15s) + analyst(15s) + sentinel(15s) + synth(15s)
      const timers: ReturnType<typeof setTimeout>[] = [];
      const schedule = (fn: () => void, ms: number) => {
        timers.push(setTimeout(fn, ms));
      };

      // Phase 1: Commander decomposing (0-5s)
      schedule(() => setState((s) => ({ ...s, scout: "searching" })), 500);

      // Phase 2: Scout active (5-20s)
      schedule(() => setState((s) => ({ ...s, analyst: "searching" })), 5000);

      // Phase 3: Analyst active (20-40s)
      schedule(() => {
        setState((s) => ({ ...s, scout: "complete" }));
      }, 20000);
      schedule(() => setState((s) => ({ ...s, sentinel: "searching" })), 20500);

      // Phase 4: Scout done, Sentinel active (40-55s)
      schedule(() => {
        setState((s) => ({ ...s, analyst: "complete" }));
      }, 40000);

      // Phase 5: All probes done, synthesizing (55-70s)
      schedule(() => {
        setState((s) => ({
          ...s,
          sentinel: "complete",
          synthesizing: true,
        }));
      }, 55000);

      // Send to ElizaOS agent in parallel - the RESEARCH_TOPIC action handles everything
      try {
        const response = await sendToAgent(`Research ${topic}`, 480000);

        // Report arrived - clear remaining timers and jump to final state
        timers.forEach(clearTimeout);

        setState((s) => ({
          ...s,
          scout: "complete",
          analyst: "complete",
          sentinel: "complete",
          synthesizing: true,
        }));

        // Brief pause to show synthesis complete
        await new Promise((r) => setTimeout(r, 600));

        triggerCompletionBurst();

        const confidence = extractConfidence(response);

        // Save to history
        try {
          const entry = {
            id: Date.now().toString(),
            topic,
            status: "completed",
            confidence,
            createdAt: new Date().toISOString(),
            report: response,
          };
          const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
          localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...existing].slice(0, 20)));
        } catch {}

        setState((s) => ({
          ...s,
          synthesizing: false,
          report: response,
          confidence,
        }));
      } catch (err) {
        timers.forEach(clearTimeout);
        throw err;
      }
    },
    [triggerCompletionBurst]
  );

  const startResearch = useCallback(async () => {
    if (!input.trim() || loading) return;

    const topic = input.trim();
    setInput("");
    setLoading(true);
    setDrawerOpen(false);
    setState({
      topic: "",
      scout: "idle",
      analyst: "idle",
      sentinel: "idle",
      synthesizing: false,
      report: null,
      confidence: 0,
      error: null,
      mode: null,
    });

    try {
      // Always re-check agent health before each research (retries once)
      agentOnline.current = await checkAgentHealth();

      if (agentOnline.current) {
        await researchViaAgent(topic);
      } else {
        // Agent not reachable - show error, no silent fallback
        setState((s) => ({
          ...s,
          topic,
          mode: null,
          error: "ElizaOS agent not responding. Make sure the agent is running on port 3000, then try again.",
        }));
      }
    } catch (err) {
      setState((s) => ({
        ...s,
        scout: s.scout === "searching" ? "error" : s.scout,
        analyst: s.analyst === "searching" ? "error" : s.analyst,
        sentinel: s.sentinel === "searching" ? "error" : s.sentinel,
        synthesizing: false,
        error: err instanceof Error ? err.message : "Research failed",
      }));
    } finally {
      setLoading(false);
    }
  }, [input, loading, researchViaAgent]);

  const probes = PROBES_META.map((p) => ({
    ...p,
    status: state[p.type],
  }));

  const handleCardClick = (probeType: string) => {
    setDrawerProbe(probeType);
    setDrawerOpen(true);
  };

  const allComplete =
    state.scout === "complete" &&
    state.analyst === "complete" &&
    state.sentinel === "complete" &&
    !state.synthesizing;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center pt-4">
        <h1 className="text-2xl font-bold text-white">Research</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Deploy the PROBE swarm to investigate any Web3 topic
        </p>
        <button
          onClick={() => setHowItWorksOpen(true)}
          className="inline-flex items-center gap-1.5 mt-2 text-[11px] text-[var(--accent)] opacity-70 hover:opacity-100 transition-opacity"
        >
          <Info className="w-3.5 h-3.5" />
          How it works
        </button>
      </div>

      {/* Search Pill */}
      <SearchPill
        value={input}
        onChange={setInput}
        onSubmit={startResearch}
        loading={loading}
      />

      {/* Mode indicator */}
      {state.mode === "eliza" && (
        <div className="text-center">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted)]">
            via ElizaOS Agent
          </span>
        </div>
      )}

      {/* Probe Visualization */}
      <AnimatePresence>
        {(state.topic || anyActive) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center justify-between mb-2 px-2">
              <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Probe Network
              </h2>
              {state.confidence > 0 && (
                <span className="text-xs px-3 py-1 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                  Confidence: {state.confidence}%
                </span>
              )}
            </div>
            <ProbeNodeGraph
              topic={state.topic}
              probes={probes}
              synthesizing={state.synthesizing}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {state.error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card !border-red-500/30 p-4 text-sm text-red-400"
        >
          <p className="font-medium">Research Error</p>
          <p className="mt-1 opacity-80">{state.error}</p>
          <button
            onClick={() => {
              setState((s) => ({ ...s, error: null }));
              if (state.topic) {
                setInput(state.topic);
              }
            }}
            className="mt-3 px-4 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Findings Cards */}
      <AnimatePresence>
        {allComplete && state.report && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PROBES_META.map((probe, i) => (
                <FindingsCard
                  key={probe.type}
                  type={probe.type}
                  label={probe.label}
                  color={probe.color}
                  findings={extractProbeSection(state.report || "", probe.type)}
                  confidence={state.confidence}
                  onClick={() => handleCardClick(probe.type)}
                  delay={i * 0.15}
                />
              ))}
            </div>

            {/* Full Briefing Card */}
            <motion.button
              onClick={() => {
                setDrawerProbe(null);
                setDrawerOpen(true);
              }}
              className="relative overflow-hidden text-left w-full rounded-2xl border border-[var(--accent)]/20 transition-all group cursor-pointer bg-[var(--card)]/80 backdrop-blur-xl hover:scale-[1.005] hover:border-[var(--accent)]/40 active:scale-[0.995]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
            >
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />
              <div className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                      Full Intelligence Briefing
                    </span>
                    <span
                      className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
                    >
                      {state.confidence}%
                    </span>
                  </div>
                  <p className="text-xs text-[var(--foreground)] opacity-60 mt-1 line-clamp-1">
                    Combined analysis from all 3 probes on: {state.topic}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {PROBES_META.map((p) => (
                    <div key={p.type} className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  ))}
                </div>
              </div>
              <div
                className="absolute bottom-0 right-0 w-48 h-48 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity rounded-tl-full"
                style={{ background: "var(--accent)" }}
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!state.topic && !loading && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-[var(--accent)]" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">
            Ready to Deploy
          </h3>
          <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
            Enter a Web3 topic above to dispatch the PROBE research swarm.
            Three specialized agents will investigate from different angles and
            synthesize a comprehensive intelligence briefing.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {[
              "Nosana protocol",
              "Solana DeFi",
              "Layer 2 trends",
              "AI x Crypto",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="px-3 py-1.5 rounded-full glass-card text-xs text-[var(--muted)] hover:text-white hover:border-[var(--accent)] transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* How it Works Modal */}
      <HowItWorksModal open={howItWorksOpen} onClose={() => setHowItWorksOpen(false)} />

      {/* Report Modal */}
      <ReportDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          drawerProbe
            ? `${drawerProbe.toUpperCase()} Report: ${state.topic}`
            : `Intelligence Briefing: ${state.topic}`
        }
        content={
          drawerProbe
            ? extractProbeSection(state.report || "", drawerProbe)
            : state.report || ""
        }
        confidence={state.confidence}
        probes={
          drawerProbe
            ? PROBES_META.filter((p) => p.type === drawerProbe).map((p) => ({ label: p.label, color: p.color }))
            : PROBES_META.map((p) => ({ label: p.label, color: p.color }))
        }
      />
    </div>
  );
}

function extractConfidence(text: string): number {
  const match = text.match(/confidence[:\s]*(\d+)/i);
  return match ? parseInt(match[1], 10) : 72;
}

function extractProbeSection(report: string, probeType: string): string {
  const lower = report.toLowerCase();
  let startMarker = "";
  let endMarkers: string[] = [];

  if (probeType === "scout") {
    startMarker = "### information";
    endMarkers = ["### data", "### community", "## risk", "## opportunities"];
  } else if (probeType === "analyst") {
    startMarker = "### data";
    endMarkers = ["### community", "## risk", "## opportunities"];
  } else if (probeType === "sentinel") {
    startMarker = "### community";
    endMarkers = ["## risk", "## opportunities", "## confidence"];
  }

  const startIdx = lower.indexOf(startMarker);
  if (startIdx === -1) return report.slice(0, 200);

  const afterStart = startIdx + startMarker.length;
  let endIdx = report.length;

  for (const marker of endMarkers) {
    const idx = lower.indexOf(marker, afterStart);
    if (idx !== -1 && idx < endIdx) endIdx = idx;
  }

  const section = report.slice(afterStart, endIdx).trim();
  return section || report.slice(0, 200);
}
