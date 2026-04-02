/**
 * ElizaOS v2 Messaging API Client
 *
 * Flow: setup channel once -> send message -> poll for agent response
 */

const AGENT_API = process.env.NEXT_PUBLIC_AGENT_API ?? "http://localhost:3000";
const USER_ID = "11111111-1111-1111-1111-111111111111";

interface ChannelSession {
  channelId: string;
  messageServerId: string;
  agentId: string;
}

let cachedSession: ChannelSession | null = null;

/** Get the first agent's ID */
async function getAgentId(): Promise<string> {
  const res = await fetch(`${AGENT_API}/api/agents`);
  if (!res.ok) throw new Error(`Failed to list agents: ${res.status}`);
  const data = await res.json();
  const agents = data.data?.agents || data.agents || data.data || data;
  if (!Array.isArray(agents) || agents.length === 0) {
    throw new Error("No agents found");
  }
  return agents[0].id;
}

/** Get the default message server ID */
async function getMessageServerId(): Promise<string> {
  const res = await fetch(`${AGENT_API}/api/messaging/message-servers`);
  if (!res.ok) throw new Error(`Failed to list message servers: ${res.status}`);
  const data = await res.json();
  const servers =
    data.data?.messageServers || data.messageServers || data.data || data;
  if (!Array.isArray(servers) || servers.length === 0) {
    throw new Error("No message servers found");
  }
  return servers[0].id;
}

/** Create a channel with agent as participant */
async function createChannel(
  messageServerId: string,
  agentId: string
): Promise<string> {
  const res = await fetch(`${AGENT_API}/api/messaging/central-channels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `probe-research-${Date.now()}`,
      message_server_id: messageServerId,
      participantCentralUserIds: [agentId, USER_ID],
      type: "DM",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create channel: ${res.status} - ${errText}`);
  }
  const result = await res.json();
  return result.data?.id || result.id;
}

/** Initialize or return cached session */
async function getSession(): Promise<ChannelSession> {
  if (cachedSession) return cachedSession;

  const agentId = await getAgentId();
  const messageServerId = await getMessageServerId();
  const channelId = await createChannel(messageServerId, agentId);

  cachedSession = { channelId, messageServerId, agentId };
  return cachedSession;
}

/** Send a message to the agent and wait for response */
export async function sendToAgent(
  message: string,
  timeoutMs = 120000
): Promise<string> {
  const session = await getSession();

  // Send the message
  const postRes = await fetch(
    `${AGENT_API}/api/messaging/central-channels/${session.channelId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelId: session.channelId,
        author_id: USER_ID,
        content: message,
        message_server_id: session.messageServerId,
      }),
    }
  );

  if (!postRes.ok) {
    const errText = await postRes.text();
    cachedSession = null;
    throw new Error(`Failed to send message: ${postRes.status} - ${errText}`);
  }

  const sendResult = await postRes.json();
  const sentMessageId = sendResult.userMessage?.id;
  const sendTime = sendResult.userMessage?.created_at || Date.now();

  // Poll for agent response
  const pollInterval = 2000;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    await new Promise((r) => setTimeout(r, pollInterval));

    try {
      const messagesRes = await fetch(
        `${AGENT_API}/api/messaging/central-channels/${session.channelId}/messages?limit=30`
      );

      if (!messagesRes.ok) continue;

      const messagesData = await messagesRes.json();
      const messages =
        messagesData.data?.messages ||
        messagesData.messages ||
        messagesData.data ||
        messagesData;

      if (!Array.isArray(messages)) continue;

      // Find agent messages after our sent message
      const agentMessages = messages.filter((msg: any) => {
        const authorId = msg.author_id || msg.authorId;
        const createdAt = msg.created_at || msg.createdAt;
        const isAgent = authorId === session.agentId;
        const isAfterSend =
          typeof createdAt === "number"
            ? createdAt > sendTime
            : new Date(createdAt).getTime() > sendTime;
        return isAgent && isAfterSend;
      });

      if (agentMessages.length > 0) {
        // Sort by length descending - longest message is most likely the report
        const sorted = agentMessages.sort((a: any, b: any) => {
          const aContent = a.content || a.text || "";
          const bContent = b.content || b.text || "";
          return bContent.length - aContent.length;
        });
        const best = sorted[0];
        const bestContent = best.content || best.text || "";

        // The agent sends 2 messages:
        // 1. Quick acknowledgment (REPLY action) - short, contains "Stand by"
        // 2. Full research report (RESEARCH_TOPIC callback) - long, contains "Intelligence Briefing" or "Confidence"
        //
        // Strategy: if we have 2+ agent messages, return the longest.
        // If only 1 message, check if it's the report (long + has report markers).
        // Otherwise keep polling until timeout.

        const hasReportMarkers =
          bestContent.includes("Intelligence Briefing") ||
          bestContent.includes("Confidence:") ||
          bestContent.includes("PROBE Intelligence") ||
          bestContent.includes("---");

        const isReport = bestContent.length > 800 || (bestContent.length > 400 && hasReportMarkers);

        if (agentMessages.length >= 2 || isReport) {
          return bestContent || JSON.stringify(best);
        }
        // Only 1 short message (acknowledgment) - keep polling for the report
      }
    } catch {
      // Continue polling on error
    }
  }

  throw new Error("Timeout waiting for agent response");
}

/** Check if ElizaOS agent is reachable (retry once on failure) */
export async function checkAgentHealth(): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${AGENT_API}/api/agents`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        if (attempt === 0) { await new Promise((r) => setTimeout(r, 1500)); continue; }
        return false;
      }
      const data = await res.json();
      const agents = data.data?.agents || data.agents || [];
      if (Array.isArray(agents) && agents.length > 0) return true;
      if (attempt === 0) { await new Promise((r) => setTimeout(r, 1500)); continue; }
      return false;
    } catch {
      if (attempt === 0) { await new Promise((r) => setTimeout(r, 1500)); continue; }
      return false;
    }
  }
  return false;
}
