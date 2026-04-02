import { v4 as uuidv4 } from "uuid";
import {
  SCOUT_PERSONA,
  ANALYST_PERSONA,
  SENTINEL_PERSONA,
  SYNTHESIZER_PROMPT,
  COMMANDER_PROMPT,
} from "../probes/personas";
import {
  createSession,
  updateSessionStatus,
  addFinding,
  getFindings,
  setReport,
  getSession,
} from "../utils/research-store";
import { recordRequest } from "../utils/metrics";
import { searchWeb, formatSearchResults } from "../utils/web-search";
import { getDefiLlamaContext } from "../utils/defillama-client";
import { getCMCContext } from "../utils/cmc-client";
import type { ProbeFinding, ResearchReport, ProbeType } from "../types/index";

const LLM_URL = process.env.OPENAI_API_URL || "https://4ksj3tve5bazqwkuyqdhwdpcar4yutcuxphwhckrdxmu.node.k8s.prd.nos.ci/v1";
const LLM_KEY = process.env.OPENAI_API_KEY || "nosana";
const LLM_MODEL = process.env.MODEL_NAME || "Qwen/Qwen3.5-4B";

async function callLLM(
  _runtime: any,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const start = Date.now();
  try {
    const res = await fetch(`${LLM_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 2000,
        temperature: 0.7,
        chat_template_kwargs: { enable_thinking: false },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      throw new Error(`LLM responded with ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    recordRequest(Date.now() - start);
    return content;
  } catch (err) {
    recordRequest(Date.now() - start);
    console.error("LLM call failed:", err);
    return "Error: Unable to generate response.";
  }
}

/** Extract short search-engine-friendly keywords from a topic + probe focus */
function buildSearchQueries(topic: string, probeType: ProbeType): string[] {
  // Extract proper nouns and key crypto/tech terms (capitalized words, known terms)
  const stopWords = new Set(["the","a","an","and","or","of","in","on","at","to","for","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","could","should","may","might","can","shall","about","with","from","into","through","during","before","after","above","below","between","under","over","how","what","which","who","whom","whose","where","when","why","that","this","these","those","than","versus","including","examining","comparative","analysis","affect","long","term","scale","their","its"]);

  const words = topic.split(/[\s,]+/).filter(w => {
    if (w.length < 2) return false;
    const lower = w.toLowerCase().replace(/[^a-z0-9.]/g, "");
    if (stopWords.has(lower)) return false;
    // Keep: capitalized words (proper nouns), acronyms, terms with dots (io.net)
    return /^[A-Z]/.test(w) || /^[A-Z]+$/.test(w) || w.includes(".");
  });

  // Fallback: if too few proper nouns, grab meaningful lowercase terms too
  if (words.length < 3) {
    const extras = topic.split(/[\s,]+/).filter(w =>
      w.length > 4 && !stopWords.has(w.toLowerCase()) && !/^[A-Z]/.test(w)
    ).slice(0, 5);
    words.push(...extras);
  }

  // Split into two groups for broader coverage (max 4 terms each)
  const half = Math.ceil(words.length / 2);
  const group1 = words.slice(0, Math.min(half, 4)).join(" ");
  const group2 = words.slice(half, half + Math.min(4, words.length - half)).join(" ");
  const all = words.slice(0, 5).join(" ");

  const focusMap: Record<string, string[]> = {
    scout: [
      `${group1} latest news 2025`,
      `${group2} announcements updates 2025`,
    ],
    analyst: [
      `${all} token price market cap`,
      `${all} GPU pricing cost comparison`,
    ],
    sentinel: [
      `${group1} community sentiment review`,
      `${group2} developer opinion criticism`,
    ],
  };

  return focusMap[probeType] || [`${all}`];
}

async function runProbe(
  runtime: any,
  sessionId: string,
  probeType: ProbeType,
  persona: typeof SCOUT_PERSONA,
  topic: string,
  specificQuery: string
): Promise<ProbeFinding> {
  const analysisQuery = specificQuery || persona.queryTemplate(topic);

  // Generate short, focused search queries for Tavily (NOT the Commander's paragraph)
  const searchQueries = buildSearchQueries(topic, probeType);

  // Run multiple focused searches and merge results
  const allResults: import("../utils/web-search").WebSearchResult[] = [];
  let anySuccess = false;

  for (const sq of searchQueries) {
    const response = await searchWeb(sq, 4);
    if (response.success) {
      anySuccess = true;
      allResults.push(...response.results);
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const uniqueResults = allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  }).slice(0, 6);

  const webContext = uniqueResults.length > 0
    ? uniqueResults.map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`).join("\n\n")
    : "No web search results available.";
  const sources = uniqueResults.map(r => r.url).filter(Boolean);

  console.log(`[PROBE:${probeType}] ${uniqueResults.length} unique web results from ${searchQueries.length} searches`);

  // Analyst probe: fetch live market data from DefiLlama + CMC in parallel
  let liveMarketBlock = "";
  if (probeType === "analyst") {
    const [llamaCtx, cmcCtx] = await Promise.allSettled([
      getDefiLlamaContext(topic),
      getCMCContext(topic),
    ]);
    const parts: string[] = [];
    if (llamaCtx.status === "fulfilled" && llamaCtx.value) parts.push(llamaCtx.value);
    if (cmcCtx.status === "fulfilled" && cmcCtx.value) parts.push(cmcCtx.value);
    if (parts.length > 0) {
      liveMarketBlock = `\n\n--- REAL-TIME MARKET DATA ---\n${parts.join("\n\n")}\n--- END REAL-TIME DATA ---`;
      console.log(`[PROBE:analyst] Live market data: DefiLlama=${llamaCtx.status === "fulfilled" && !!llamaCtx.value}, CMC=${cmcCtx.status === "fulfilled" && !!cmcCtx.value}`);
    }
  }

  // Build enriched prompt: web results FIRST, then live market data, then analysis instruction
  const enrichedQuery = `--- LIVE WEB SEARCH RESULTS (${uniqueResults.length} sources found) ---\n${webContext}\n--- END WEB RESULTS ---${liveMarketBlock}\n\nRESEARCH TASK: ${analysisQuery}\n\nINSTRUCTIONS: You MUST use the web search results above as your PRIMARY source. Reference specific findings from the search results and cite their URLs. If real-time market data is provided above, use those exact figures for prices, TVL, and volumes — they are live data fetched seconds ago. Supplement with your own knowledge only where the search results have gaps. Every claim should have a source URL where possible.`;

  const result = await callLLM(runtime, persona.systemPrompt, enrichedQuery);

  const finding: ProbeFinding = {
    id: uuidv4(),
    sessionId,
    probeType,
    query: analysisQuery,
    findings: result,
    sources,
    confidence: estimateConfidence(result, anySuccess),
    createdAt: new Date().toISOString(),
  };

  addFinding(finding);
  return finding;
}

function estimateConfidence(text: string, hasWebResults = false): number {
  if (text.startsWith("Error:") || text.length < 50) return 15;

  let score = 35;
  const lower = text.toLowerCase();

  // Web-grounded responses get significant boost
  if (hasWebResults) score += 20;

  // URL citations (count them, each adds confidence)
  const urlCount = (text.match(/https?:\/\/[^\s)]+/g) || []).length;
  score += Math.min(urlCount * 4, 20);

  // Structured content (headers, bullet points, data formatting)
  const bulletCount = (text.match(/^[\s]*[-*•]/gm) || []).length;
  score += Math.min(bulletCount * 2, 12);
  if (text.includes("**")) score += 3; // bold formatting = structured
  if (/\$[\d,.]+/.test(text)) score += 5; // contains dollar amounts
  if (/\d+%/.test(text)) score += 3; // contains percentages

  // Content depth
  if (text.length > 600) score += 4;
  if (text.length > 1200) score += 4;

  // Source attribution language
  if (lower.includes("according to") || lower.includes("source:")) score += 5;
  if (lower.includes("high confidence") || lower.includes("confirmed")) score += 3;

  // Mild penalties for severe uncertainty only
  if (lower.includes("no data") && lower.includes("retrieved")) score -= 15;
  if (lower.includes("error:") || lower.includes("unable to")) score -= 20;

  return Math.max(15, Math.min(92, score));
}

async function decomposeTopic(
  runtime: any,
  topic: string
): Promise<{ scout: string; analyst: string; sentinel: string }> {
  const result = await callLLM(
    runtime,
    COMMANDER_PROMPT,
    `Research topic: ${topic}`
  );

  const lines = result.split("\n").filter((l: string) => l.trim());
  let scout = SCOUT_PERSONA.queryTemplate(topic);
  let analyst = ANALYST_PERSONA.queryTemplate(topic);
  let sentinel = SENTINEL_PERSONA.queryTemplate(topic);

  for (const line of lines) {
    if (line.startsWith("SCOUT:")) scout = line.replace("SCOUT:", "").trim();
    if (line.startsWith("ANALYST:")) analyst = line.replace("ANALYST:", "").trim();
    if (line.startsWith("SENTINEL:")) sentinel = line.replace("SENTINEL:", "").trim();
  }

  return { scout, analyst, sentinel };
}

async function synthesizeReport(
  runtime: any,
  sessionId: string,
  topic: string
): Promise<ResearchReport> {
  const allFindings = getFindings(sessionId);

  const findingsText = allFindings
    .map(
      (f) =>
        `--- ${f.probeType.toUpperCase()} FINDINGS (confidence: ${f.confidence}%) ---\n${f.findings}`
    )
    .join("\n\n");

  const synthesisInput = `Topic: ${topic}\n\nResearch findings from all probes:\n\n${findingsText}\n\nSynthesize these findings into a structured intelligence briefing.`;

  const reportText = await callLLM(runtime, SYNTHESIZER_PROMPT, synthesisInput);

  const overallConfidence = Math.round(
    allFindings.reduce((sum, f) => sum + f.confidence, 0) / allFindings.length
  );

  const report: ResearchReport = {
    summary: reportText,
    sections: allFindings.map((f) => ({
      title: `${f.probeType.charAt(0).toUpperCase() + f.probeType.slice(1)} Report`,
      source: f.probeType,
      content: f.findings,
      confidence: f.confidence,
      keyFindings: extractKeyFindings(f.findings),
    })),
    overallConfidence,
    metadata: {
      topic,
      probesUsed: ["scout", "analyst", "sentinel"],
      totalSources: allFindings.reduce((sum, f) => sum + f.sources.length, 0),
      generatedAt: new Date().toISOString(),
    },
  };

  setReport(sessionId, report);
  return report;
}

function extractKeyFindings(text: string): string[] {
  const lines = text.split("\n").filter((l) => l.trim().startsWith("-") || l.trim().startsWith("*"));
  return lines.slice(0, 5).map((l) => l.replace(/^[\s\-\*]+/, "").trim());
}

export const researchTopicAction = {
  name: "RESEARCH_TOPIC",
  description:
    "Deploy the PROBE research swarm to investigate a Web3 topic from multiple angles. Dispatches Scout, Analyst, and Sentinel probes, then synthesizes findings into a structured intelligence briefing.",
  similes: [
    "RESEARCH",
    "INVESTIGATE",
    "ANALYZE_TOPIC",
    "PROBE_TOPIC",
    "INTEL",
    "BRIEFING",
    "STUDY",
    "DEEP_DIVE",
  ],
  validate: async (_runtime: any, message: any) => {
    const text = (message?.content?.text || "").toLowerCase();
    const triggers = [
      "research",
      "investigate",
      "analyze",
      "probe",
      "find out about",
      "what do you know about",
      "tell me about",
      "look into",
      "intelligence on",
      "briefing on",
      "study",
    ];
    return triggers.some((t) => text.includes(t));
  },
  handler: async (runtime: any, message: any, state: any, options: any, callback: any) => {
    const rawText = message?.content?.text || "";
    const topic = rawText
      .replace(/^(research|investigate|analyze|probe|look into|study)\s*/i, "")
      .trim();

    if (!topic) {
      if (callback) {
        callback({ text: "Please provide a topic to research. Example: 'Research Nosana protocol'" });
      }
      return;
    }

    const sessionId = uuidv4();
    createSession(sessionId, topic);

    // Skip acknowledgment callback - the LLM already generates a "deploying" text reply.
    // Only send the final report via callback so the frontend gets the actual research.

    updateSessionStatus(sessionId, "probes_dispatched");

    try {
      // Commander decomposes topic into specialized queries
      const queries = await decomposeTopic(runtime, topic);

      // Run probes sequentially - Nosana vLLM is a single GPU, parallel requests
      // cause contention and produce empty/degraded responses
      await runProbe(runtime, sessionId, "scout", SCOUT_PERSONA, topic, queries.scout);
      updateSessionStatus(sessionId, "scout_complete");

      await runProbe(runtime, sessionId, "analyst", ANALYST_PERSONA, topic, queries.analyst);
      updateSessionStatus(sessionId, "analyst_complete");

      await runProbe(runtime, sessionId, "sentinel", SENTINEL_PERSONA, topic, queries.sentinel);
      updateSessionStatus(sessionId, "sentinel_complete");

      // Synthesize all findings
      updateSessionStatus(sessionId, "synthesizing");
      const report = await synthesizeReport(runtime, sessionId, topic);
      updateSessionStatus(sessionId, "completed");

      // Deliver the briefing
      if (callback) {
        callback({
          text: `**PROBE Intelligence Briefing: ${topic}**\n\nSession: \`${sessionId}\` | Confidence: ${report.overallConfidence}%\n\n${report.summary}\n\n---\n*3 probes deployed | ${report.sections.length} sections | Generated ${new Date().toISOString()}*`,
        });
      }
    } catch (err) {
      updateSessionStatus(sessionId, "failed");
      console.error("Research failed:", err);
      if (callback) {
        callback({
          text: `Research swarm encountered an error on topic: ${topic}. Session ${sessionId} marked as failed. Error: ${err instanceof Error ? err.message : "Unknown error"}`,
        });
      }
    }

    return;
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "Research the Nosana protocol" },
      },
      {
        name: "PROBE",
        content: {
          text: "Deploying PROBE research swarm on: Nosana protocol...",
          action: "RESEARCH_TOPIC",
        },
      },
    ],
  ],
};
