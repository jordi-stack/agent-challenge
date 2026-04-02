import { getAllSessions } from "../utils/research-store";

export const historyProvider = {
  name: "research-history",
  description:
    "Provides access to past research sessions so the agent can reference previous findings",
  get: async (_runtime: any, message: any) => {
    const sessions = getAllSessions();
    const completed = sessions.filter((s) => s.status === "completed");

    if (completed.length === 0) {
      return { text: "No completed research available in history." };
    }

    const text = message?.content?.text?.toLowerCase() || "";

    const relevant = completed.filter((s) =>
      text.split(" ").some((word: string) =>
        s.topic.toLowerCase().includes(word) && word.length > 3
      )
    );

    if (relevant.length > 0) {
      const session = relevant[0];
      return {
        text: `Found previous research on "${session.topic}" (confidence: ${session.report?.overallConfidence}%, date: ${session.createdAt}):\n${session.report?.summary || "No report available."}`,
      };
    }

    const topicList = completed
      .slice(0, 10)
      .map((s) => `- "${s.topic}" (${s.createdAt}, confidence: ${s.report?.overallConfidence}%)`)
      .join("\n");

    return { text: `Research history (${completed.length} completed sessions):\n${topicList}` };
  },
};
