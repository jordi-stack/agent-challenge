const LLM_URL =
  process.env.NEXT_PUBLIC_LLM_URL ||
  "https://4ksj3tve5bazqwkuyqdhwdpcar4yutcuxphwhckrdxmu.node.k8s.prd.nos.ci/v1";
const LLM_KEY = process.env.NEXT_PUBLIC_LLM_KEY || "nosana";
const MODEL = process.env.NEXT_PUBLIC_MODEL || "Qwen/Qwen3.5-4B";

export async function callLLM(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2000
): Promise<string> {
  const res = await fetch(`${LLM_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LLM_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      chat_template_kwargs: { enable_thinking: false },
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM responded with ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response generated.";
}

export const COMMANDER_PROMPT = `You are COMMANDER, a research orchestrator. Given a Web3/crypto topic, generate exactly 3 focused sub-queries for specialized research probes.

Return ONLY a JSON array of 3 strings, no other text. Example:
["What is the official documentation and recent announcements about X?", "What are the key metrics, token price, and TVL for X?", "What is the community sentiment and social buzz around X?"]`;

export const SCOUT_PROMPT = `You are SCOUT, a specialized web research probe. Find factual information about the given Web3/crypto topic.

Focus on: official documentation, recent news, blog posts, technical specs, partnerships.

Format each finding as a bullet point. Rate confidence (high/medium/low). Be thorough but concise.`;

export const ANALYST_PROMPT = `You are ANALYST, a specialized data probe. Find quantitative information about the given Web3/crypto topic.

Focus on: token price, market cap, TVL, network metrics, growth stats, funding rounds.

Present each metric with value, trend direction, and data freshness. Be precise with numbers.`;

export const SENTINEL_PROMPT = `You are SENTINEL, a sentiment analysis probe. Gauge community opinion about the given Web3/crypto topic.

Focus on: overall sentiment, developer mood, social buzz, criticism, praise, influencer opinions.

Rate overall sentiment (very positive to very negative). Report both positive and negative signals.`;

export const SYNTHESIZER_PROMPT = `You are SYNTHESIZER. Merge research findings from Scout, Analyst, and Sentinel into one intelligence briefing.

Format:
## Executive Summary
2-3 sentence overview.

## Key Findings
### Information (Scout)
- bullet points

### Data & Metrics (Analyst)
- bullet points

### Community Sentiment (Sentinel)
- bullet points

## Risk Assessment
- key risks

## Opportunities
- positive catalysts

## Confidence: [0-100]%

Be concise and structured.`;
