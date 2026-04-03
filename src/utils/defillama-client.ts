const LLAMA_API = "https://api.llama.fi";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MIN_TVL = 1_000_000; // $1M minimum — filters out placeholder/empty entries

// Generic crypto terms that should not be used as primary protocol anchors
const GENERIC_TERMS = new Set([
  "ZK", "DeFi", "DEX", "CEX", "L1", "L2", "NFT", "DAO", "AMM",
  "ETF", "GPU", "AI", "RWA", "LST", "LSD", "BTC", "ETH",
]);

interface ProtocolListItem {
  name: string;
  slug: string;
  tvl: number;
  change_1d: number | null;
  change_7d: number | null;
  category: string | null;
  chains: string[];
  gecko_id: string | null;
  mcap: number | null;
}

let cache: { data: ProtocolListItem[]; ts: number } | null = null;

async function loadProtocols(): Promise<ProtocolListItem[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) return cache.data;
  try {
    const res = await fetch(`${LLAMA_API}/protocols`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return cache?.data ?? [];
    const raw: any[] = await res.json();
    const data: ProtocolListItem[] = raw.map((p) => ({
      name: p.name ?? "",
      slug: p.slug ?? "",
      tvl: typeof p.tvl === "number" ? p.tvl : 0,
      change_1d: p.change_1d ?? null,
      change_7d: p.change_7d ?? null,
      category: p.category ?? null,
      chains: Array.isArray(p.chains) ? p.chains : [],
      gecko_id: p.gecko_id ?? null,
      mcap: p.mcap ?? null,
    }));
    cache = { data, ts: Date.now() };
    console.log(`[DefiLlama] Cached ${data.length} protocols`);
    return data;
  } catch {
    return cache?.data ?? [];
  }
}

/** Score how well a protocol name/slug matches the anchor term. */
function scoreMatch(name: string, slug: string, anchor: string): number {
  const a = anchor.toLowerCase();
  const n = name.toLowerCase();
  const s = slug.toLowerCase();
  const nWords = n.split(/[\s\-_]+/);

  if (nWords[0] === a) return 100;           // First word exact match
  if (nWords.some((w) => w === a)) return 85; // Any word exact match
  if (n.startsWith(a)) return 80;            // Name starts with anchor
  if (n.includes(a)) return 60;             // Name contains anchor
  if (s === a) return 75;                   // Slug exact
  if (s.startsWith(a)) return 60;           // Slug starts with anchor
  if (s.includes(a)) return 40;             // Slug contains anchor
  return 0;
}

/**
 * Extract the primary protocol name from a free-form research topic.
 * Prefers camelCase protocol names (zkSync) and proper nouns (Hyperliquid)
 * over generic crypto acronyms (ZK, DeFi, DEX).
 */
function extractAnchor(topic: string): string {
  const words = topic.split(/[\s,.:;()\[\]]+/);
  const candidates = words.filter(
    (w) =>
      w.length > 1 &&
      (/^[A-Z]/.test(w) || /[a-z][A-Z]/.test(w) || w.includes("."))
  );
  // Skip generic acronyms — pick first specific protocol name
  const specific = candidates.find((w) => !GENERIC_TERMS.has(w));
  return specific ?? candidates[0] ?? words[0] ?? topic;
}

function formatNum(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

/**
 * Fetch live TVL and protocol stats from DefiLlama for a research topic.
 * Returns null if the topic does not correspond to a known DeFi protocol
 * or if the matched protocol has negligible TVL.
 */
export async function getDefiLlamaContext(topic: string): Promise<string | null> {
  const anchor = extractAnchor(topic);
  const protocols = await loadProtocols();
  if (protocols.length === 0) return null;

  let best: ProtocolListItem | null = null;
  let bestScore = 0;

  for (const p of protocols) {
    const sc = scoreMatch(p.name, p.slug, anchor);
    if (
      sc > bestScore ||
      (sc === bestScore && best !== null && p.tvl > best.tvl)
    ) {
      bestScore = sc;
      best = p;
    }
  }

  // Require a meaningful match and non-trivial TVL
  if (!best || bestScore < 40 || best.tvl < MIN_TVL) {
    console.log(
      `[DefiLlama] No match for "${anchor}" (bestScore: ${bestScore}, tvl: ${best?.tvl ?? 0})`
    );
    return null;
  }

  const lines: string[] = [
    `=== LIVE DEFILLAMA DATA (${new Date().toUTCString()}) ===`,
    `Protocol : ${best.name}`,
    `TVL      : ${formatNum(best.tvl)}`,
  ];
  if (best.change_1d != null)
    lines.push(`TVL 24h  : ${best.change_1d >= 0 ? "+" : ""}${best.change_1d.toFixed(2)}%`);
  if (best.change_7d != null)
    lines.push(`TVL 7d   : ${best.change_7d >= 0 ? "+" : ""}${best.change_7d.toFixed(2)}%`);
  if (best.mcap && best.mcap > 0)
    lines.push(`Mkt Cap  : ${formatNum(best.mcap)}`);
  if (best.category)
    lines.push(`Category : ${best.category}`);
  if (best.chains.length)
    lines.push(`Chains   : ${best.chains.slice(0, 8).join(", ")}`);
  lines.push(`Source   : defillama.com`);
  lines.push(`=== END DEFILLAMA DATA ===`);

  console.log(
    `[DefiLlama] "${anchor}" → "${best.name}" (score: ${bestScore}, TVL: ${formatNum(best.tvl)})`
  );
  return lines.join("\n");
}
