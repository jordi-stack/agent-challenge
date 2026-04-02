"use client";

import { useState, useEffect, useRef } from "react";
import { Activity, Cpu, Clock, Zap, Server, HardDrive } from "lucide-react";
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

export default function InfrastructurePage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const historyRef = useRef<HistoryPoint[]>([]);
  const startTimeRef = useRef<number>(Date.now());
  const requestCountRef = useRef<number>(0);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const healthRes = await fetch(`${AGENT_API}/healthz`);
        const agentsRes = await fetch(`${AGENT_API}/api/agents`);

        if (healthRes.ok && agentsRes.ok) {
          const healthData = await healthRes.json();
          const agentsData = await agentsRes.json();
          const agent = agentsData.data?.agents?.[0];

          // Measure actual round-trip latency
          const latencyStart = Date.now();
          try { await fetch(`${AGENT_API}/healthz`); } catch {}
          const measuredLatency = Date.now() - latencyStart;

          const uptimeMs = Date.now() - startTimeRef.current;
          requestCountRef.current++;

          setMetrics({
            uptime: uptimeMs / 1000,
            requestCount: requestCountRef.current,
            avgLatency: measuredLatency,
            model: "Qwen/Qwen3.5-4B",
            endpoint: "Nosana Decentralized GPU Network",
            status: agent?.status || "unknown",
            startedAt: new Date(startTimeRef.current).toISOString(),
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
            {connected ? "Connected to Nosana Network" : "Offline Mode (Demo Data)"}
          </span>
          {!connected && (
            <span className="text-xs text-[var(--muted)] ml-auto">
              Agent not reachable at {AGENT_API}
            </span>
          )}
        </div>
      </FloatingCard>

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard icon={Clock} label="Uptime" value={formatUptime(metrics.uptime)} sub={`Since ${new Date(metrics.startedAt).toLocaleString()}`} color="#22c55e" delay={0} />
          <MetricCard icon={Zap} label="Latency" value={`${metrics.avgLatency}ms`} sub={`${metrics.requestCount} health checks`} color="#10b981" delay={0.05} />
          <MetricCard icon={Activity} label="Status" value={metrics.status} sub={`Agent: PROBE`} color="#f59e0b" delay={0.1} />
          <MetricCard icon={Cpu} label="Model" value={metrics.model.split("-").slice(0, 2).join("-")} sub={metrics.model} color="#22d3ee" delay={0.15} />
          <MetricCard icon={Server} label="Network" value="Nosana" sub="Decentralized GPU Network (Solana)" color="#a78bfa" delay={0.2} />
          <MetricCard icon={HardDrive} label="Endpoint" value="vLLM" sub={metrics.endpoint} color="#ec4899" delay={0.25} />
        </div>
      )}

      {/* Offline state */}
      {!metrics && !loading && (
        <FloatingCard>
          <div className="text-center py-8">
            <p className="text-white font-medium">Agent Offline</p>
            <p className="text-sm text-[var(--muted)] mt-1">No connection to {AGENT_API}</p>
          </div>
        </FloatingCard>
      )}

      {/* Charts */}
      {history.length > 1 && <LazyCharts history={history} />}

      {/* Architecture Info */}
      <FloatingCard>
        <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">
          Deployment Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-[var(--accent)] text-xs uppercase tracking-wider mb-1">Compute</p>
            <p className="text-white">Nosana Decentralized GPU</p>
            <p className="text-[var(--muted)] text-xs mt-1">Powered by Solana</p>
          </div>
          <div>
            <p className="text-[var(--accent)] text-xs uppercase tracking-wider mb-1">Inference</p>
            <p className="text-white">Qwen/Qwen3.5-4B</p>
            <p className="text-[var(--muted)] text-xs mt-1">32,768 token context</p>
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
