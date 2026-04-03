const CG_API = "https://api.coingecko.com/api/v3";

// Generic crypto terms to skip when extracting anchor for token search
const GENERIC_TERMS = new Set([
  "ZK", "DeFi", "DEX", "CEX", "L1", "L2", "NFT", "DAO", "AMM",
  "ETF", "GPU", "AI", "RWA", "LST", "LSD", "BTC", "ETH",
]);

function extractAnchor(topic: string): string {
  const words = topic.split(/[\s,.:;()\[\]]+/);
  const candidates = words.filter(
    (w) =>
      w.length > 1 &&
      (/^[A-Z]/.test(w) || /[a-z][A-Z]/.test(w) || w.includes("."))
  );
  const specific = candidates.find((w) => !GENERIC_TERMS.has(w));
  return specific ?? candidates[0] ?? words[0] ?? topic;
}

function fmt(n: number, d = 2): string {
  return n.toFixed(d);
}

function fmtLarge(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(2)}`;
}

/** Search CoinGecko for a coin ID by query string. Returns the highest-ranked result. */
async function searchCoinId(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${CG_API}/search?query=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const coins: any[] = data.coins ?? [];
    if (coins.length === 0) return null;

    // Prefer coins with a known market cap rank (established tokens)
    const ranked = coins.filter((c) => c.market_cap_rank != null);
    if (ranked.length === 0) return coins[0]?.id ?? null;
    ranked.sort((a, b) => a.market_cap_rank - b.market_cap_rank);
    return ranked[0].id as string;
  } catch {
    return null;
  }
}

/**
 * Fetch live market data for a coin from CoinGecko /coins/markets.
 * Returns price, market cap, volume, 24h/7d % change, rank, supply.
 */
async function fetchCoinMarket(geckoId: string): Promise<any | null> {
  try {
    const url =
      `${CG_API}/coins/markets` +
      `?vs_currency=usd` +
      `&ids=${encodeURIComponent(geckoId)}` +
      `&price_change_percentage=7d` +
      `&per_page=1` +
      `&sparkline=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const arr: any[] = await res.json();
    return arr[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch live token price and market data from CoinGecko for a research topic.
 * No API key required. Covers all 15,000+ tokens listed on CoinGecko.
 * Returns null if the topic does not map to a known token.
 */
export async function getCoinGeckoContext(topic: string): Promise<string | null> {
  const anchor = extractAnchor(topic);
  const geckoId = await searchCoinId(anchor);
  if (!geckoId) {
    console.log(`[CoinGecko] No token found for "${anchor}"`);
    return null;
  }

  const coin = await fetchCoinMarket(geckoId);
  if (!coin || coin.current_price == null) return null;

  const price = coin.current_price as number;
  const displayPrice =
    price < 0.001
      ? fmt(price, 8)
      : price < 0.01
      ? fmt(price, 6)
      : price < 1
      ? fmt(price, 4)
      : fmt(price, 2);

  const lines: string[] = [
    `=== LIVE COINGECKO DATA (${new Date().toUTCString()}) ===`,
    `Token    : ${coin.name} (${String(coin.symbol ?? "?").toUpperCase()})`,
  ];
  if (coin.market_cap_rank != null)
    lines.push(`Rank     : #${coin.market_cap_rank}`);
  lines.push(`Price    : $${displayPrice}`);
  if (coin.market_cap)
    lines.push(`Mkt Cap  : ${fmtLarge(coin.market_cap)}`);
  if (coin.total_volume)
    lines.push(`Vol 24h  : ${fmtLarge(coin.total_volume)}`);
  if (coin.price_change_percentage_24h != null)
    lines.push(
      `Chg 24h  : ${coin.price_change_percentage_24h >= 0 ? "+" : ""}${fmt(coin.price_change_percentage_24h)}%`
    );
  if (coin.price_change_percentage_7d_in_currency != null)
    lines.push(
      `Chg 7d   : ${coin.price_change_percentage_7d_in_currency >= 0 ? "+" : ""}${fmt(coin.price_change_percentage_7d_in_currency)}%`
    );
  if (coin.circulating_supply)
    lines.push(
      `Circ Sup : ${(coin.circulating_supply / 1e6).toFixed(2)}M ${String(coin.symbol ?? "").toUpperCase()}`
    );
  lines.push(`Source   : coingecko.com`);
  lines.push(`=== END COINGECKO DATA ===`);

  console.log(
    `[CoinGecko] ${coin.name} (${String(coin.symbol ?? "").toUpperCase()}) @ $${displayPrice}`
  );
  return lines.join("\n");
}
