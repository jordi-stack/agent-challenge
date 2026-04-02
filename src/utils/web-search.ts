const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "";
const TAVILY_URL = "https://api.tavily.com/search";

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  query: string;
  success: boolean;
}

export async function searchWeb(
  query: string,
  maxResults = 5
): Promise<WebSearchResponse> {
  if (!TAVILY_API_KEY) {
    console.warn("[WebSearch] No TAVILY_API_KEY set, skipping web search. Check .env file.");
    return { results: [], query, success: false };
  }
  console.log(`[WebSearch] Searching: "${query.slice(0, 80)}..." (max ${maxResults} results)`);

  try {
    const res = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        max_results: maxResults,
        search_depth: "basic",
        include_answer: false,
        include_raw_content: false,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error(`[WebSearch] Tavily responded with ${res.status}`);
      return { results: [], query, success: false };
    }

    const data = await res.json();
    const results: WebSearchResult[] = (data.results || []).map((r: any) => ({
      title: r.title || "",
      url: r.url || "",
      content: r.content || "",
      score: r.score || 0,
    }));

    console.log(`[WebSearch] Found ${results.length} results (top score: ${results[0]?.score?.toFixed(2) || 'N/A'}) for: "${query.slice(0, 60)}"`);
    return { results, query, success: true };
  } catch (err) {
    console.error("[WebSearch] Search failed:", err);
    return { results: [], query, success: false };
  }
}

export function formatSearchResults(response: WebSearchResponse): string {
  if (!response.success || response.results.length === 0) {
    return "No web search results available. Respond based on your training data.";
  }

  return response.results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`
    )
    .join("\n\n");
}
