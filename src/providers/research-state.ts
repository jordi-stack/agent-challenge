import { getAllSessions } from "../utils/research-store";

export const researchStateProvider = {
  name: "research-state",
  description: "Provides current research session state and progress to the agent",
  get: async (_runtime: any, _message: any) => {
    const sessions = getAllSessions();
    const recent = sessions.slice(0, 5);

    if (recent.length === 0) {
      return { text: "No research sessions have been conducted yet." };
    }

    const summaries = recent.map((s) => {
      const probeCount = s.probeFindings.length;
      const confidence = s.report?.overallConfidence || 0;
      return `- [${s.status}] "${s.topic}" (${probeCount} probes, confidence: ${confidence}%) - ${s.createdAt}`;
    });

    return { text: `Recent research sessions:\n${summaries.join("\n")}` };
  },
};
