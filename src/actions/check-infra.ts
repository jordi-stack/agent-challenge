import { getMetrics, formatUptime } from "../utils/metrics";
import { getNosanaDeployment, getNosanaCredits } from "../utils/nosana-client";

export const checkInfraAction = {
  name: "CHECK_INFRASTRUCTURE",
  description:
    "Report on PROBE's own Nosana deployment health, including uptime, inference latency, memory usage, and live Nosana Network deployment status.",
  similes: [
    "INFRA_STATUS",
    "HEALTH_CHECK",
    "SYSTEM_STATUS",
    "HOW_ARE_YOU_RUNNING",
    "DEPLOYMENT_STATUS",
  ],
  validate: async (_runtime: any, message: any) => {
    const text = (message?.content?.text || "").toLowerCase();
    const triggers = [
      "infrastructure",
      "health",
      "status",
      "how are you running",
      "deployment",
      "uptime",
      "latency",
      "metrics",
      "nosana status",
      "system status",
    ];
    return triggers.some((t) => text.includes(t));
  },
  handler: async (
    _runtime: any,
    _message: any,
    _state: any,
    _options: any,
    callback: any
  ) => {
    const metrics = getMetrics();

    // Fetch live Nosana deployment and credits data in parallel
    const [deployment, credits] = await Promise.all([
      getNosanaDeployment(),
      getNosanaCredits(),
    ]);

    const nosanaSection = deployment
      ? [
          ``,
          `**Nosana Deployment**`,
          ``,
          `| Field | Value |`,
          `|-------|-------|`,
          `| Deployment ID | \`${deployment.id ?? process.env.NOSANA_DEPLOYMENT_ID ?? "N/A"}\` |`,
          `| Status | ${deployment.status ?? "N/A"} |`,
          `| Market | ${deployment.market ?? "N/A"} |`,
          `| Strategy | ${deployment.strategy ?? "INFINITE"} |`,
          `| Replicas | ${deployment.replicas ?? 1} |`,
          `| Timeout | ${deployment.timeout ? Math.round(deployment.timeout / 3600) + "h" : "N/A"} |`,
          credits != null
            ? `| Credits | ${typeof credits.balance === "number" ? credits.balance.toFixed(4) : credits.balance} ${credits.currency ?? "NOS"} |`
            : `| Credits | N/A |`,
        ]
      : [
          ``,
          `**Nosana Deployment**`,
          ``,
          `Set \`NOSANA_API_KEY\` and \`NOSANA_DEPLOYMENT_ID\` env vars to see live deployment data.`,
        ];

    const report = [
      `**PROBE Infrastructure Status**`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Runtime | Nosana Decentralized GPU Network |`,
      `| Model | ${metrics.model} |`,
      `| Uptime | ${formatUptime(metrics.uptime)} |`,
      `| Requests Processed | ${metrics.requestCount} |`,
      `| Avg Inference Latency | ${metrics.avgLatency}ms |`,
      `| Memory (RSS) | ${metrics.memoryUsage.rss}MB |`,
      `| Memory (Heap Used) | ${metrics.memoryUsage.heapUsed}MB |`,
      `| Memory (Heap Total) | ${metrics.memoryUsage.heapTotal}MB |`,
      `| Environment | ${metrics.nodeEnv} |`,
      `| Started At | ${metrics.startedAt} |`,
      ``,
      `**Endpoint:** \`${metrics.endpoint}\``,
      ...nosanaSection,
      ``,
      `All systems operational. Running on decentralized infrastructure.`,
    ].join("\n");

    if (callback) {
      callback({ text: report });
    }

    return;
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "How are you running?" },
      },
      {
        name: "PROBE",
        content: {
          text: "PROBE Infrastructure Status: Running on Nosana...",
          action: "CHECK_INFRASTRUCTURE",
        },
      },
    ],
  ],
};
