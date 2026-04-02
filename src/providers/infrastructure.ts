import { getMetrics, formatUptime } from "../utils/metrics";

export const infrastructureProvider = {
  name: "infrastructure",
  description:
    "Provides real-time infrastructure metrics so the agent is self-aware of its Nosana deployment",
  get: async () => {
    const m = getMetrics();
    return {
      text: [
        `Infrastructure: Nosana Decentralized GPU Network`,
        `Model: ${m.model}`,
        `Uptime: ${formatUptime(m.uptime)}`,
        `Requests: ${m.requestCount}`,
        `Avg latency: ${m.avgLatency}ms`,
        `Memory: ${m.memoryUsage.heapUsed}MB / ${m.memoryUsage.heapTotal}MB`,
        `Environment: ${m.nodeEnv}`,
      ].join(" | "),
    };
  },
};
