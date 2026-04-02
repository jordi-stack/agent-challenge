const LLAMA_API = "https://api.llama.fi";

interface ProtocolData {
  name: string;
  tvl: number;
  change_1d?: number;
  change_7d?: number;
  change_1m?: number;
  category?: string;
  chains?: string[];
  volume24h?: number;
}

/** Derive slug candidates from a research topic */
function slugCandidates(topic: string): string[] {
  const words = topic.split(/[\s,.:]+/);
  const proper = words.filter((w) => /^[A-Z]/.test(w) && w.length > 1);

  const candidates: string[] = [];

  if (proper.length > 0) {
    candidates.push(proper[0].toLowerCase());
    if (proper.length > 1) {
      candidates.push(`${proper[0]}-${proper[1]}`.toLowerCase());
    }
  }

  // Also try first word with dots stripped (io.net → ionet)
  const first = words[0]?.toLowerCase().replace(/[^a-z0-9-]/g, "") ?? "";
  if (first && !candidates.includes(first)) candidates.push(first);

  return [...new Set(candidates)];
}

async function fetchProtocol(slug: string): Promise<ProtocolData | null> {
  try {
    const res = await fetch(`${LLAMA_API}/protocol/${slug}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const d = await res.json();

    // Total TVL: sum currentChainTvls if present, else use root tvl
    let tvl = d.tvl ?? 0;
    if (d.currentChainTvls && typeof d.currentChainTvls === "object") {
      const sum = Object.values(d.currentChainTvls as Record<string, number>).reduce(
        (a, b) => a + (b || 0),
        0
      );
      if (sum > 0) tvl = sum;
    }

    return {
      name: d.name,
      tvl,
      change_1d: d.change_1d,
      change_7d: d.change_7d,
      change_1m: d.change_1m,
      category: d.category,
      chains: d.chains,
      volume24h: d.volume24h,
    };
  } catch {
    return null;
  }
}

function formatTVL(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

/** Fetch live DefiLlama protocol data for an Analyst prompt.
 *  Returns a formatted string or null if the protocol is not found. */
export async function getDefiLlamaContext(topic: string): Promise<string | null> {
  const slugs = slugCandidates(topic);

  let data: ProtocolData | null = null;
  for (const slug of slugs) {
    data = await fetchProtocol(slug);
    if (data) break;
  }

  if (!data) return null;

  const lines: string[] = [
    `=== LIVE DEFILLAMA DATA (${new Date().toUTCString()}) ===`,
    `Protocol : ${data.name}`,
    `TVL      : ${formatTVL(data.tvl)}`,
  ];

  if (data.change_1d != null)
    lines.push(`TVL 24h  : ${data.change_1d >= 0 ? "+" : ""}${data.change_1d.toFixed(2)}%`);
  if (data.change_7d != null)
    lines.push(`TVL 7d   : ${data.change_7d >= 0 ? "+" : ""}${data.change_7d.toFixed(2)}%`);
  if (data.change_1m != null)
    lines.push(`TVL 30d  : ${data.change_1m >= 0 ? "+" : ""}${data.change_1m.toFixed(2)}%`);
  if (data.volume24h != null)
    lines.push(`Vol 24h  : ${formatTVL(data.volume24h)}`);
  if (data.category)
    lines.push(`Category : ${data.category}`);
  if (data.chains?.length)
    lines.push(`Chains   : ${data.chains.slice(0, 8).join(", ")}`);

  lines.push(`Source   : api.llama.fi/protocol`);
  lines.push(`=== END DEFILLAMA DATA ===`);

  console.log(`[DefiLlama] Found data for "${data.name}" (TVL: ${formatTVL(data.tvl)})`);
  return lines.join("\n");
}
