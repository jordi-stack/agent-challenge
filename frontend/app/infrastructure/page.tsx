"use client";

import { useState, useEffect, useRef } from "react";
import { Activity, Cpu, Clock, Zap, Server, HardDrive, Globe, Coins, LayoutGrid, RefreshCw } from "lucide-react";
import { FloatingCard } from "../components/floating-card";
import { SkeletonGrid } from "../components/skeleton-loader";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const LazyCharts = dynamic(() => import("../components/infra-charts"), { ssr: false });

interface Metrics {
  uptime: number;
  requestCount: number;
  avgLatency: number;
  model: string;
  endpoint: string;
  status: string;
  startedAt: string;
}

interface HistoryPoint {
  time: string;
  latency: number;
}

interface NosanaDeployment {
  id?: string;
  status?: string;
  market?: string;
  replicas?: number;
  timeout?: number;
  strategy?: string;
  createdAt?: string;
  created_at?: string;
}

interface NosanaCredits {
  balance?: number;
  currency?: string;
}

interface NosanaStatus {
  deployment?: NosanaDeployment | null;
  credits?: NosanaCredits | null;
  updatedAt?: string;
}

const AGENT_API = process.env.NEXT_PUBLIC_AGENT_API ?? "http://localhost:3000";

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  sub?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay || 0 }}
    >
      <FloatingCard glowColor={color}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <span className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wider">
            {label}
          </span>
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-[var(--muted)] mt-1">{sub}</p>}
      </FloatingCard>
    </motion.div>
  );
}

function NosanaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--card-border)] last:border-0">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <span className={`text-xs text-white ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  );
}

export default function InfrastructurePage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [nosana, setNosana] = useState<NosanaStatus | null>(null);
  const [containerStartedAt, setContainerStartedAt] = useState<number | null>(null);
  const historyRef = useRef<HistoryPoint[]>([]);
  const requestCountRef = useRef<number>(0);

  // Fetch real container start time written by start.sh — persists across page refreshes
  useEffect(() => {
    fetch("/probe-start.json", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.startedAt) setContainerStartedAt(new Date(d.startedAt).getTime()); })
      .catch(() => {});
  }, []);

  // Fetch ElizaOS agent metrics
  useEffect(() => {
    async function fetchMetrics() {
      try {
        const agentsRes = await fetch(`${AGENT_API}/api/agents`);

        if (agentsRes.ok) {
          const agentsData = await agentsRes.json();
          const agent = agentsData.data?.agents?.[0];

          const latencyStart = Date.now();
          try { await fetch(`${AGENT_API}/api/agents`); } catch {}
          const measuredLatency = Date.now() - latencyStart;

          const startMs = containerStartedAt ?? Date.now();
          const uptimeMs = Date.now() - startMs;
          requestCountRef.current++;

          setMetrics({
            uptime: uptimeMs / 1000,
            requestCount: requestCountRef.current,
            avgLatency: measuredLatency,
            model: "Qwen/Qwen3.5-4B",
            endpoint: "Nosana Decentralized GPU Network",
            status: agent?.status || "active",
            startedAt: new Date(startMs).toISOString(),
          });
          setConnected(true);

          historyRef.current = [...historyRef.current.slice(-29), {
            time: new Date().toLocaleTimeString(),
            latency: measuredLatency,
          }];
          setHistory([...historyRef.current]);
        }
      } catch {
        setConnected(false);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [containerStartedAt]);

  // Fetch Nosana deployment status (written by start.sh polling script)
  useEffect(() => {
    async function fetchNosanaStatus() {
      try {
        const res = await fetch("/nosana-status.json", { cache: "no-store" });
        if (res.ok) {
          const data: NosanaStatus = await res.json();
          setNosana(data);
        }
      } catch {
        // File not present — NOSANA_API_KEY / NOSANA_DEPLOYMENT_ID not configured
      }
    }
    fetchNosanaStatus();
    const interval = setInterval(fetchNosanaStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-7 h-7 text-[var(--accent)]" />
            Infrastructure
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">Loading metrics...</p>
        </div>
        <SkeletonGrid count={6} />
      </div>
    );
  }

  const dep = nosana?.deployment;
  const cred = nosana?.credits;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Activity className="w-7 h-7 text-[var(--accent)]" />
          Infrastructure
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Nosana deployment health monitoring
        </p>
      </div>

      {/* Connection Status */}
      <FloatingCard>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-3 h-3 rounded-full ${
                connected ? "bg-[var(--success)]" : "bg-[var(--danger)]"
              }`}
            />
            {connected && (
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-[var(--success)] animate-ping opacity-40" />
            )}
          </div>
          <span className="text-sm text-white font-medium">
            {connected ? "Connected to Nosana Network" : "Agent Offline"}
          </span>
          {nosana?.updatedAt && (
            <span className="text-xs text-[var(--muted)] ml-auto flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Nosana data updated {new Date(nosana.updatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </FloatingCard>

      {/* Agent Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard icon={Clock} label="Uptime" value={formatUptime(metrics.uptime)} sub={`Since ${new Date(metrics.startedAt).toLocaleString()}`} color="#22c55e" delay={0} />
          <MetricCard icon={Zap} label="Latency" value={`${metrics.avgLatency}ms`} sub={`${metrics.requestCount} health checks`} color="#10b981" delay={0.05} />
          <MetricCard icon={Activity} label="Status" value={metrics.status} sub="Agent: PROBE" color="#f59e0b" delay={0.1} />
          <MetricCard icon={Cpu} label="Model" value={metrics.model.split("-").slice(0, 2).join("-")} sub={metrics.model} color="#22d3ee" delay={0.15} />
          <MetricCard icon={Server} label="Network" value="Nosana" sub="Decentralized GPU Network (Solana)" color="#a78bfa" delay={0.2} />
          <MetricCard icon={HardDrive} label="Endpoint" value="vLLM" sub={metrics.endpoint} color="#ec4899" delay={0.25} />
        </div>
      )}

      {!metrics && !loading && (
        <FloatingCard>
          <div className="text-center py-8">
            <p className="text-white font-medium">Agent Offline</p>
            <p className="text-sm text-[var(--muted)] mt-1">ElizaOS not reachable</p>
          </div>
        </FloatingCard>
      )}

      {/* Charts */}
      {history.length > 1 && <LazyCharts history={history} />}

      {/* Nosana Deployment Data */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <FloatingCard glowColor="#10b981">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              Nosana Deployment
            </h2>
            {dep?.status && (
              <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                dep.status === "RUNNING"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
              }`}>
                {dep.status}
              </span>
            )}
          </div>

          {dep ? (
            <div>
              <NosanaRow label="Deployment ID" value={dep.id ? `${dep.id.slice(0, 8)}...${dep.id.slice(-6)}` : "N/A"} mono />
              <NosanaRow label="Market" value={dep.market ?? "N/A"} />
              <NosanaRow label="Strategy" value={dep.strategy ?? "INFINITE"} />
              <NosanaRow label="Replicas" value={String(dep.replicas ?? 1)} />
              <NosanaRow label="Timeout" value={dep.timeout ? `${Math.round(dep.timeout / 3600)}h` : "N/A"} />
              {(dep.createdAt ?? dep.created_at) && (
                <NosanaRow label="Created" value={new Date(dep.createdAt ?? dep.created_at ?? "").toLocaleDateString()} />
              )}
            </div>
          ) : (
            <p className="text-xs text-[var(--muted)]">
              Set <span className="font-mono text-white/60">NOSANA_API_KEY</span> and{" "}
              <span className="font-mono text-white/60">NOSANA_DEPLOYMENT_ID</span> to see live deployment data.
            </p>
          )}
        </FloatingCard>
      </motion.div>

      {/* Nosana Credits */}
      {(dep || cred) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <FloatingCard glowColor="#a78bfa">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-4 h-4 text-[#a78bfa]" />
              <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Credits
              </h2>
            </div>
            {cred != null ? (
              <div>
                <p className="text-3xl font-bold text-white">
                  {typeof cred.balance === "number" ? cred.balance.toFixed(4) : "N/A"}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">{cred.currency ?? "NOS"} remaining</p>
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)]">Credits data not available</p>
            )}
          </FloatingCard>
        </motion.div>
      )}

      {/* Architecture Info */}
      <FloatingCard>
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            Deployment Architecture
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-[var(--accent)] text-xs uppercase tracking-wider mb-1">Compute</p>
            <p className="text-white">Nosana Decentralized GPU</p>
            <p className="text-[var(--muted)] text-xs mt-1">Powered by Solana</p>
          </div>
          <div>
            <p className="text-[var(--accent)] text-xs uppercase tracking-wider mb-1">Inference</p>
            <p className="text-white">Qwen/Qwen3.5-4B</p>
            <p className="text-[var(--muted)] text-xs mt-1">32,768 token context · vLLM</p>
          </div>
          <div>
            <p className="text-[var(--accent)] text-xs uppercase tracking-wider mb-1">Framework</p>
            <p className="text-white">ElizaOS v2</p>
            <p className="text-[var(--muted)] text-xs mt-1">Multi-agent orchestration</p>
          </div>
        </div>
      </FloatingCard>
    </div>
  );
}
