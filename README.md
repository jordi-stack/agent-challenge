# PROBE - Web3 Intelligence Swarm

Multi-agent Web3 research intelligence system built on ElizaOS v2, deployed on Nosana's decentralized GPU network.

PROBE dispatches three specialized research agents (Scout, Analyst, Sentinel) to investigate Web3 topics from multiple angles, then synthesizes findings into structured intelligence briefings with confidence scores. The agent is self-aware of its own Nosana infrastructure.

## Architecture

```
User Input (topic)
      |
  COMMANDER -- decomposes topic into specialized sub-queries
      |
      |-- SCOUT -------- web research: articles, docs, announcements
      |-- ANALYST ------- data: metrics, prices, statistics
      |-- SENTINEL ------ sentiment: community opinions, social buzz
              |
        SYNTHESIZER ---- merges all findings into structured report
```

### Plugin Architecture

Not just actions. Full ElizaOS plugin with:

| Type | Components |
|------|-----------|
| Actions | RESEARCH_TOPIC, CHECK_INFRASTRUCTURE |
| Providers | ResearchStateProvider, HistoryProvider, InfrastructureProvider |
| Evaluators | QualityEvaluator, CompletenessEvaluator |

### Nosana Integration

PROBE treats Nosana as part of its identity, not just a deployment target:

- **Self-monitoring**: Infrastructure dashboard shows real-time deployment health (latency, uptime, memory, model info)
- **Self-awareness**: Agent can report on its own Nosana deployment when asked
- **Health endpoint**: `/api/health` and `/api/metrics` expose runtime data
- **Optimized container**: Multi-stage Dockerfile, minimal production image
- **CLI deployment**: Documented pipeline using `@nosana/cli`

## Frontend

Full Next.js dashboard with 5 pages:

| Page | Purpose |
|------|---------|
| **Research** | Main interface. Topic input, probe visualization with animated data flow, intelligence briefing display |
| **History** | Past research sessions, searchable, with saved reports |
| **Watchlist** | Track projects with periodic re-research |
| **Infrastructure** | Self-monitoring Nosana deployment health metrics |
| **Settings** | Configure probe behavior and agent connection |

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Agent Framework | ElizaOS v2 |
| Model | Qwen/Qwen3.5-4B (Nosana inference) |
| Frontend | Next.js 15, Tailwind CSS, Framer Motion, Recharts |
| Deployment | Nosana Decentralized GPU Network |
| Blockchain | Solana |

## Quick Start

### Prerequisites

- Node.js 23+
- pnpm (`npm install -g pnpm`)
- Docker (for deployment)

### Local Development

```bash
# Clone
git clone https://github.com/jordi-stack/agent-challenge
cd agent-challenge

# Configure
cp .env.example .env

# Install agent dependencies
pnpm install

# Install ElizaOS CLI
bun i -g @elizaos/cli

# Start agent (port 3000)
elizaos dev --character ./characters/probe.character.json

# In another terminal, start frontend (port 3001)
cd frontend && npm install && npm run dev
```

### Deploy to Nosana

```bash
# Build Docker image
docker build -t jordistack/probe-web3-intelligence:latest .

# Test locally
docker run -p 3000:3000 --env-file .env jordistack/probe-web3-intelligence:latest

# Push to Docker Hub
docker push jordistack/probe-web3-intelligence:latest

# Deploy via Nosana CLI
nosana job post \
  --file ./nos_job_def/nosana_eliza_job_definition.json \
  --market nvidia-3090 \
  --timeout 300 \
  --api <YOUR_API_KEY>
```

## Project Structure

```
probe-web3-intelligence/
|-- characters/
|   |-- probe.character.json       # Main agent character (PROBE)
|-- src/
|   |-- index.ts                   # Plugin entry point
|   |-- actions/
|   |   |-- research-topic.ts      # Multi-agent research orchestration
|   |   |-- check-infra.ts         # Nosana self-monitoring
|   |-- providers/
|   |   |-- research-state.ts      # Active research tracking
|   |   |-- history.ts             # Past research access
|   |   |-- infrastructure.ts      # Runtime metrics
|   |-- evaluators/
|   |   |-- quality.ts             # Confidence scoring
|   |   |-- completeness.ts        # Coverage assessment
|   |-- probes/
|   |   |-- personas.ts            # Scout, Analyst, Sentinel personas
|   |-- types/
|   |   |-- index.ts               # TypeScript types
|   |-- utils/
|       |-- research-store.ts      # Persistence layer
|       |-- metrics.ts             # Runtime metrics collection
|-- frontend/
|   |-- app/
|       |-- page.tsx               # Research page (main)
|       |-- history/page.tsx       # History page
|       |-- watchlist/page.tsx     # Watchlist page
|       |-- infrastructure/page.tsx # Nosana health dashboard
|       |-- settings/page.tsx      # Settings page
|       |-- components/
|           |-- sidebar.tsx        # Navigation sidebar
|           |-- probe-visualizer.tsx # Animated probe visualization
|-- nos_job_def/
|   |-- nosana_eliza_job_definition.json
|-- Dockerfile                     # Multi-stage production build
|-- docs/
    |-- PROBE-DESIGN-SPEC.md       # Full design specification
```

## How PROBE Works

1. **You enter a topic** (e.g., "Nosana protocol")
2. **Commander** decomposes it into three specialized sub-queries
3. **Scout** searches the web for articles, documentation, and announcements
4. **Analyst** hunts for metrics, statistics, and market data
5. **Sentinel** analyzes community sentiment and social perception
6. **Synthesizer** merges all findings into a structured intelligence briefing
7. **Quality Evaluator** scores confidence per finding
8. **Completeness Evaluator** checks all angles were covered

Each probe has a distinct personality and system prompt. The frontend visualizes the probes working in real-time with animated data flow.

## License

MIT
