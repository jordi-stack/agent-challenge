# PROBE - Web3 Intelligence Swarm

Multi-agent Web3 research system built on ElizaOS v2, deployed on Nosana's decentralized GPU network.

PROBE dispatches three specialized research agents (Scout, Analyst, Sentinel) to investigate any Web3 topic from multiple angles, then synthesizes findings into structured intelligence briefings with confidence scores. The agent monitors its own Nosana infrastructure and can report on its deployment health.

## Architecture

```
User Input (topic)
      |
  COMMANDER -- decomposes topic into 3 focused sub-queries
      |
      |-- SCOUT -------- web research: articles, docs, announcements
      |-- ANALYST ------- data: metrics, prices, on-chain stats
      |-- SENTINEL ------ sentiment: community opinions, social buzz
              |
        SYNTHESIZER ---- merges all findings into structured briefing
```

Probes run sequentially on Nosana's single-GPU vLLM. Each probe runs 2 focused Tavily web searches, places results first in the LLM prompt, and is instructed to cite URLs for every finding.

### Plugin

Full ElizaOS v2 plugin (not just a character file):

| Type | Components |
|------|-----------|
| Actions | `RESEARCH_TOPIC`, `CHECK_INFRASTRUCTURE` |
| Providers | `ResearchStateProvider`, `HistoryProvider`, `InfrastructureProvider` |
| Evaluators | `QualityEvaluator`, `CompletenessEvaluator` |

## Frontend

Next.js 16 dashboard with 5 pages:

| Page | Purpose |
|------|---------|
| **Research** | Topic input, animated probe node graph, intelligence briefing display |
| **History** | Past research sessions with saved reports |
| **Watchlist** | Track projects for periodic re-research |
| **Infrastructure** | Real-time Nosana deployment health (latency, uptime, model info) |
| **Settings** | Agent connection and probe behavior configuration |

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Agent Framework | ElizaOS v2 (1.7.2) |
| Model | Qwen/Qwen3.5-4B via Nosana inference |
| Web Search | Tavily API |
| Frontend | Next.js 16, Tailwind CSS v4, Framer Motion, Recharts |
| Deployment | Nosana Decentralized GPU Network |
| Blockchain | Solana |

## Quick Start

### Prerequisites

- Node.js 23+
- pnpm (`npm install -g pnpm`)
- ElizaOS CLI (`npm install -g @elizaos/cli`)

### Local Development

```bash
# Clone
git clone https://github.com/jordi-stack/agent-challenge
cd agent-challenge

# Configure environment
cp .env.example .env
# Edit .env: add your TAVILY_API_KEY

# Install dependencies
pnpm install

# Apply vLLM compatibility fix (3 patches, required after every pnpm install)
FILE=$(find node_modules/.pnpm -path "*/@elizaos/plugin-openai/dist/node/index.node.js" | grep -v patches | head -1)

# Patch 1: Responses API
sed -i 's/openai\.languageModel(modelName)/openai.chat(modelName)/g' "$FILE"

# Patch 2+3: developer role + disable thinking mode
printf 'const _origFetch = globalThis.fetch;\nglobalThis.fetch = async (url, opts) => {\n  if (typeof url === "string" && url.includes("/chat/completions") && opts && opts.body) {\n    try {\n      const b = JSON.parse(opts.body);\n      if (b.messages) b.messages.forEach(m => { if (m.role === "developer") m.role = "system"; });\n      b.chat_template_kwargs = { enable_thinking: false };\n      opts = { ...opts, body: JSON.stringify(b) };\n    } catch(e) {}\n  }\n  return _origFetch(url, opts);\n};\n' | cat - "$FILE" > /tmp/fixed.js && mv /tmp/fixed.js "$FILE"

# Start agent (port 3000)
elizaos dev

# In another terminal, start frontend (port 6969)
cd frontend && npm install && npm run dev
```

If you get a DB migration error, run: `rm -rf .eliza && elizaos dev`

### Environment Variables

```env
OPENAI_API_KEY=nosana
OPENAI_BASE_URL=https://4ksj3tve5bazqwkuyqdhwdpcar4yutcuxphwhckrdxmu.node.k8s.prd.nos.ci/v1
OPENAI_API_URL=https://4ksj3tve5bazqwkuyqdhwdpcar4yutcuxphwhckrdxmu.node.k8s.prd.nos.ci/v1
MODEL_NAME=Qwen/Qwen3.5-4B
OPENAI_EMBEDDING_URL=https://4yiccatpyxx773jtewo5ccwhw1s2hezq5pehndb6fcfq.node.k8s.prd.nos.ci/v1
OPENAI_EMBEDDING_API_KEY=nosana
OPENAI_EMBEDDING_MODEL=Qwen3-Embedding-0.6B
OPENAI_EMBEDDING_DIMENSIONS=1024
TAVILY_API_KEY=your_tavily_key_here
SERVER_PORT=3000
```

## Deploy to Nosana

### Step 1: Build and push Docker image

```bash
docker build --network host -t jordistack/probe-web3-intelligence:v5 .
docker push jordistack/probe-web3-intelligence:v5
```

The Dockerfile applies the vLLM fix automatically during build and uses nginx (port 80) to serve the frontend at `/` and proxy `/api/*` to ElizaOS.

### Step 2: Deploy via Nosana Dashboard

1. Go to [deploy.nosana.com](https://deploy.nosana.com)
2. Create a new deployment with the contents of `nos_job_def/nosana_eliza_job_definition.json`
3. Set `TAVILY_API_KEY` to your actual key
4. Strategy: **Infinite**, Timeout: **6h**

### Step 3: Deploy via Nosana CLI

```bash
npm install -g @nosana/cli

nosana job post \
  --file ./nos_job_def/nosana_eliza_job_definition.json \
  --market nvidia-3090 \
  --timeout 300 \
  --api <YOUR_NOSANA_API_KEY>
```

## Project Structure

```
agent-challenge/
├── characters/
│   └── probe.character.json        # PROBE agent character
├── src/
│   ├── index.ts                    # Project entry point (exports agents array)
│   ├── actions/
│   │   ├── research-topic.ts       # Multi-probe research orchestration
│   │   └── check-infra.ts          # Nosana self-monitoring
│   ├── providers/
│   │   ├── research-state.ts       # Active research tracking
│   │   ├── history.ts              # Past research access
│   │   └── infrastructure.ts       # Runtime metrics
│   ├── evaluators/
│   │   ├── quality.ts              # Confidence scoring
│   │   └── completeness.ts         # Coverage assessment
│   ├── probes/
│   │   └── personas.ts             # Scout, Analyst, Sentinel system prompts
│   ├── types/index.ts
│   └── utils/
│       ├── research-store.ts       # In-memory research persistence
│       ├── metrics.ts              # Runtime metrics collection
│       └── web-search.ts           # Tavily integration
├── frontend/                       # Next.js 16 dashboard
│   └── app/
│       ├── page.tsx                # Research page (main)
│       ├── history/page.tsx
│       ├── watchlist/page.tsx
│       ├── infrastructure/page.tsx
│       ├── settings/page.tsx
│       ├── components/             # 15 components
│       └── lib/
│           ├── eliza-client.ts     # ElizaOS v2 messaging API client
│           └── llm.ts              # Probe persona prompts
├── nos_job_def/
│   └── nosana_eliza_job_definition.json
├── Dockerfile                      # Multi-stage: nginx + ElizaOS, port 80
├── nginx.conf                      # Reverse proxy config
└── start.sh                        # Container startup script
```

## How PROBE Works

1. You enter a topic (e.g., "io.net GPU marketplace")
2. **Commander** decomposes it into 3 focused sub-queries
3. **Scout** runs 2 Tavily searches for recent news and documentation
4. **Analyst** runs 2 Tavily searches for price, market cap, and metrics
5. **Sentinel** runs 2 Tavily searches for community sentiment and opinions
6. **Synthesizer** merges all findings into a structured intelligence briefing
7. **Quality Evaluator** scores confidence based on URL citations, data points, structure
8. **Completeness Evaluator** checks all research angles were covered

Total: 5 LLM calls + 6 web searches per research session (~90-150 seconds).

## Star History

<a href="https://www.star-history.com/?repos=nosana-ci%2Fagent-challenge&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/image?repos=nosana-ci/agent-challenge&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/image?repos=nosana-ci/agent-challenge&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/image?repos=nosana-ci/agent-challenge&type=date&legend=top-left" />
 </picture>
</a>

## License

MIT
