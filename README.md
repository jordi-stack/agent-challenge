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


## Configure Your Embedding Model

Nosana provides a hosted **Qwen3-Embedding-0.6B** endpoint for embeddings (used for RAG, semantic search, and memory). Update your `.env`:

```env
OPENAI_EMBEDDING_URL=https://4yiccatpyxx773jtewo5ccwhw1s2hezq5pehndb6fcfq.node.k8s.prd.nos.ci/v1
OPENAI_EMBEDDING_API_KEY=nosana
OPENAI_EMBEDDING_MODEL=Qwen3-Embedding-0.6B
OPENAI_EMBEDDING_DIMENSIONS=1024
```

**Model Details:**
- **Model ID:** `Qwen3-Embedding-0.6B`
- **Dimensions:** 1024
- **Provider:** Nosana decentralized inference

---

## Customize Your Agent

### 1. Define your agent's character

Edit `characters/agent.character.json` to define your agent's personality, knowledge, and behavior:

```json
{
  "name": "MyAgent",
  "bio": ["Your agent's backstory and capabilities"],
  "system": "Your agent's core instructions and behavior",
  "plugins": ["@elizaos/plugin-bootstrap", "@elizaos/plugin-openai"],
  "clients": ["direct"]
}
```

### 2. Add plugins

Extend your agent by adding plugins to `package.json` and your character file:

| Plugin | Use Case |
|--------|----------|
| `@elizaos/plugin-bootstrap` | Required base plugin |
| `@elizaos/plugin-openai` | OpenAI-compatible LLM (required for Nosana endpoint) |
| `@elizaos/plugin-web-search` | Web search capability |
| `@elizaos/plugin-telegram` | Telegram bot client |
| `@elizaos/plugin-discord` | Discord bot client |
| `@elizaos/plugin-twitter` | Twitter/X integration |
| `@elizaos/plugin-browser` | Browser/web automation |
| `@elizaos/plugin-sql` | Database access |

Install a plugin:
```bash
pnpm add @elizaos/plugin-web-search
```

Add it to your character file:
```json
{
  "plugins": ["@elizaos/plugin-bootstrap", "@elizaos/plugin-openai", "@elizaos/plugin-web-search"]
}
```

### 3. Build custom actions (optional)

Add your own custom logic in `src/index.ts`. See the example plugin already included.

### 4. Persistent storage

SQLite is configured by default — sufficient for development and small-scale agents. For a production-grade personal agent, consider:

- A mounted volume on Nosana
- External database (PostgreSQL, PlanetScale, etc.)
- Decentralized storage (Arweave, IPFS)

---

## Deploy to Nosana

> **Important:** For this challenge, you must deploy your agent to Nosana's decentralized infrastructure. Do **not** use the standard `elizaos deploy` command — that deploys to centralized cloud providers. This challenge is about embracing decentralized compute.

**Why Nosana?**
- **Decentralized** — Your agent runs on a distributed network of GPU providers, not AWS/GCP/Azure
- **Cost-effective** — Use your free builders credits (no credit card required)
- **Permissionless** — No vendor lock-in, full control over your infrastructure
- **Challenge requirement** — All submissions must be deployed on Nosana

### Prerequisites

Before deploying, ensure you have:
- [Docker](https://docs.docker.com/get-docker/) installed and running
- A [Docker Hub](https://hub.docker.com/) account (free)
- Your [Nosana builders credits](https://nosana.com/builders-credits) claimed

### Step 1: Build and Push Your Docker Image

Your agent needs to be containerized and available on a public registry (Docker Hub) so Nosana nodes can pull and run it.

```bash
# Build your Docker image
docker build -t yourusername/nosana-eliza-agent:latest .

# Test it locally first (recommended)
docker run -p 3000:3000 --env-file .env yourusername/nosana-eliza-agent:latest

# Visit http://localhost:3000 to verify it works

# Log in to Docker Hub
docker login

# Push to Docker Hub (make it public)
docker push yourusername/nosana-eliza-agent:latest
```

> **Tip:** Replace `yourusername` with your actual Docker Hub username. Make sure your repository is **public** so Nosana nodes can pull it.

### Step 2: Configure Your Job Definition

Edit `nos_job_def/nosana_eliza_job_definition.json` and update the Docker image reference:

```json
{
  "version": "0.1",
  "type": "container",
  "meta": {
    "trigger": "cli"
  },
  "ops": [
    {
      "type": "container/run",
      "id": "eliza-agent",
      "args": {
        "image": "yourusername/nosana-eliza-agent:latest",  // <- Change this
        "ports": ["3000:3000"],
        "env": {
          "OPENAI_API_KEY": "nosana",
          "OPENAI_API_URL": "https://6vq2bcqphcansrs9b88ztxfs88oqy7etah2ugudytv2x.node.k8s.prd.nos.ci/v1",
          "MODEL_NAME": "Qwen3.5-27B-AWQ-4bit"
        }
      }
    }
  ]
}
```

> **Security Note:** For production deployments, avoid hardcoding sensitive environment variables. Consider using Nosana secrets management or external secret stores.

### Step 3: Deploy via Nosana Dashboard (Easiest)

This is the recommended method for beginners:

1. Visit the [Nosana Dashboard](https://dashboard.nosana.com/deploy)
2. Connect your Solana wallet (you need this for authentication and using credits)
3. Click **Expand** to open the job definition editor
4. Copy and paste the contents of your `nos_job_def/nosana_eliza_job_definition.json` file
5. Select your preferred compute market:
   - `nvidia-3090` — High performance (recommended for production)
   - `nvidia-rtx-4090` — Premium performance
   - `cpu-only` — Budget option (slower inference)
6. Click **Deploy**
7. Wait for a node to pick up your job (usually 30-60 seconds)
8. Once running, you'll receive a public URL to access your agent

### Step 4: Deploy via Nosana CLI (Advanced)

For developers who prefer the command line or want to automate deployments:

1. First get your API key at [https://deploy.nosana.com/account/](https://deploy.nosana.com/account/)
2. Edit the [Nosana ElizaOS Job Definition File](./nos_job_def/nosana_eliza_job_definition.json)
3. Learn more about [Nosana Job Definition Here](https://learn.nosana.com/deployments/jobs/job-definition/intro.html)

```bash
# Install the Nosana CLI globally
npm install -g @nosana/cli

# Deploy your agent
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
