import { getMetrics, formatUptime } from "../utils/metrics";
import { getNosanaDeployment } from "../utils/nosana-client";

export const infrastructureProvider = {
  name: "infrastructure",
  description:
    "Provides real-time infrastructure metrics so the agent is self-aware of its Nosana deployment",
  get: async () => {
    const m = getMetrics();
    const deployment = await getNosanaDeployment();

    const nosanaPart = deployment
      ? ` | Nosana deployment: ${deployment.id ?? process.env.NOSANA_DEPLOYMENT_ID} (${deployment.status ?? "RUNNING"}) on market ${deployment.market ?? "N/A"} strategy ${deployment.strategy ?? "INFINITE"}`
      : "";

    return {
      text: [
        `Infrastructure: Nosana Decentralized GPU Network`,
        `Model: ${m.model}`,
        `Uptime: ${formatUptime(m.uptime)}`,
        `Requests: ${m.requestCount}`,
        `Avg latency: ${m.avgLatency}ms`,
        `Memory: ${m.memoryUsage.heapUsed}MB / ${m.memoryUsage.heapTotal}MB`,
        `Environment: ${m.nodeEnv}`,
      ].join(" | ") + nosanaPart,
    };
  },
};
