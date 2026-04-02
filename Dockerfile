# syntax=docker/dockerfile:1

# ============================================================
# PROBE - Web3 Intelligence Swarm
# nginx (port 80) serves frontend + proxies /api/* to ElizaOS (port 3000)
# ============================================================

# Stage 1: Frontend static build
# NEXT_PUBLIC_AGENT_API="" → frontend uses relative /api/* URLs
# nginx proxies /api/* to ElizaOS on localhost:3000
FROM node:23-slim AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN NEXT_PUBLIC_AGENT_API="" npm run build

# Stage 2: Agent + nginx
FROM node:23-slim

RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  git \
  curl \
  nginx \
  && rm -rf /var/lib/apt/lists/*

ENV ELIZAOS_TELEMETRY_DISABLED=true
ENV DO_NOT_TRACK=1

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Apply vLLM compatibility fix to plugin-openai
# Fixes: Responses API (languageModel->chat), developer role, thinking mode
RUN FILE=$(find node_modules/.pnpm -path "*/@elizaos/plugin-openai/dist/node/index.node.js" | grep -v patches | head -1) && \
    sed -i 's/openai\.languageModel(modelName)/openai.chat(modelName)/g' "$FILE" && \
    printf 'const _origFetch = globalThis.fetch;\nglobalThis.fetch = async (url, opts) => {\n  if (typeof url === "string" && url.includes("/chat/completions") && opts && opts.body) {\n    try {\n      const b = JSON.parse(opts.body);\n      if (b.messages) b.messages.forEach(m => { if (m.role === "developer") m.role = "system"; });\n      b.chat_template_kwargs = { enable_thinking: false };\n      opts = { ...opts, body: JSON.stringify(b) };\n    } catch(e) {}\n  }\n  return _origFetch(url, opts);\n};\n' | cat - "$FILE" > /tmp/fixed.js && mv /tmp/fixed.js "$FILE" && \
    echo "vLLM fix applied to: $FILE"

COPY characters/ ./characters/
COPY src/ ./src/
COPY tsconfig.json ./
COPY .env.example ./.env

# Frontend static files from builder
COPY --from=frontend-builder /frontend/out ./frontend/out

# nginx config
COPY nginx.conf /etc/nginx/sites-available/default

# Startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

RUN mkdir -p /app/data

EXPOSE 80

ENV NODE_ENV=production
ENV SERVER_PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost/api/agents || exit 1

CMD ["/app/start.sh"]
