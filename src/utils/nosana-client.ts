/**
 * Nosana Network API client
 *
 * Calls the Nosana REST API to fetch real deployment and credits data.
 * API docs: https://learn.nosana.com/api/intro.html
 * Swagger:  https://dashboard.k8s.prd.nos.ci/api/swagger
 */

const NOSANA_API = "https://dashboard.k8s.prd.nos.ci/api";

export interface NosanaDeployment {
  id: string;
  status: string;
  market: string;
  replicas: number;
  timeout: number;
  strategy: string;
  createdAt?: string;
  created_at?: string;
}

export interface NosanaCredits {
  balance: number;
  currency?: string;
}

export interface NosanaStatus {
  deployment: NosanaDeployment | null;
  credits: NosanaCredits | null;
  updatedAt: string;
}

async function nosanaFetch(path: string): Promise<any> {
  const apiKey = process.env.NOSANA_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(`${NOSANA_API}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

export async function getNosanaDeployment(): Promise<NosanaDeployment | null> {
  const id = process.env.NOSANA_DEPLOYMENT_ID;
  if (!id) return null;
  return nosanaFetch(`/deployments/${id}`);
}

export async function getNosanaCredits(): Promise<NosanaCredits | null> {
  return nosanaFetch("/credits");
}

export async function getNosanaStatus(): Promise<NosanaStatus> {
  const [deployment, credits] = await Promise.all([
    getNosanaDeployment(),
    getNosanaCredits(),
  ]);
  return { deployment, credits, updatedAt: new Date().toISOString() };
}
