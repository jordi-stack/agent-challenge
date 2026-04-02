const CMC_API = "https://pro-api.coinmarketcap.com/v1";

/** Derive a CoinMarketCap slug from a research topic.
 *  CMC slugs are lowercase-hyphen, same format as CoinGecko IDs. */
function cmcSlug(topic: string): string {
  const words = topic.split(/[\s,.:]+/);

  // Prefer explicit parenthetical symbol: "Nosana (NOS)" -> use name not symbol for slug
  const parenName = topic.match(/^([A-Za-z0-9.]+)\s*\(/)?.[1];
  if (parenName) return parenName.toLowerCase();

  // Otherwise use first proper noun
  const proper = words.find((w) => /^[A-Z]/.test(w) && w.length > 1);
  if (proper) return proper.toLowerCase();

  return words[0]?.toLowerCase().replace(/[^a-z0-9-]/g, "") ?? "";
}

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function fmtLarge(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

/** Fetch live token quote from CoinMarketCap.
 *  Returns formatted string or null if key not set / token not found. */
export async function getCMCContext(topic: string): Promise<string | null> {
  const apiKey = process.env.COINMARKETCAP_API_KEY;
  if (!apiKey) return null;

  const slug = cmcSlug(topic);
  if (!slug) return null;

  try {
    const url = `${CMC_API}/cryptocurrency/quotes/latest?slug=${encodeURIComponent(slug)}&convert=USD`;
    const res = await fetch(url, {
      headers: { "X-CMC_PRO_API_KEY": apiKey },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const json = await res.json();
    // CMC returns data keyed by slug when using the slug param
    const entries = Object.values(json.data ?? {}) as any[];
    if (entries.length === 0) return null;

    const token = entries[0];
    const usd = token.quote?.USD;
    if (!usd) return null;

    const lines: string[] = [
      `=== LIVE CMC DATA (${new Date().toUTCString()}) ===`,
      `Token       : ${token.name} (${token.symbol})`,
      `CMC Rank    : #${token.cmc_rank}`,
      `Price       : $${fmt(usd.price, usd.price < 1 ? 6 : 4)}`,
      `Market Cap  : ${fmtLarge(usd.market_cap)}`,
      `Vol 24h     : ${fmtLarge(usd.volume_24h)}`,
      `Change 1h   : ${usd.percent_change_1h >= 0 ? "+" : ""}${fmt(usd.percent_change_1h)}%`,
      `Change 24h  : ${usd.percent_change_24h >= 0 ? "+" : ""}${fmt(usd.percent_change_24h)}%`,
      `Change 7d   : ${usd.percent_change_7d >= 0 ? "+" : ""}${fmt(usd.percent_change_7d)}%`,
    ];

    if (token.circulating_supply) {
      lines.push(
        `Circ Supply : ${(token.circulating_supply / 1e6).toFixed(2)}M ${token.symbol}`
      );
    }
    if (token.max_supply) {
      lines.push(
        `Max Supply  : ${(token.max_supply / 1e6).toFixed(2)}M ${token.symbol}`
      );
    }

    lines.push(`Source      : coinmarketcap.com`);
    lines.push(`=== END CMC DATA ===`);

    console.log(`[CMC] Found data for ${token.name} (${token.symbol}) @ $${fmt(usd.price, 4)}`);
    return lines.join("\n");
  } catch (err) {
    console.warn("[CMC] Fetch failed:", err);
    return null;
  }
}
