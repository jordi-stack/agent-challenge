import type { InfraMetrics } from "../types/index";

const startedAt = new Date().toISOString();
let requestCount = 0;
let totalLatency = 0;

export function recordRequest(latencyMs: number): void {
  requestCount++;
  totalLatency += latencyMs;
}

export function getMetrics(): InfraMetrics {
  const mem = process.memoryUsage();
  return {
    uptime: process.uptime(),
    requestCount,
    avgLatency: requestCount > 0 ? Math.round(totalLatency / requestCount) : 0,
    memoryUsage: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    },
    model: process.env.MODEL_NAME || "Qwen/Qwen3.5-4B",
    endpoint: process.env.OPENAI_API_URL || "unknown",
    nodeEnv: process.env.NODE_ENV || "development",
    startedAt,
  };
}

export function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}
