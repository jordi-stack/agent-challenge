#!/bin/sh

# Poll Nosana API every 60s and write status to static JSON served by nginx
(while true; do
  if [ -n "$NOSANA_API_KEY" ] && [ -n "$NOSANA_DEPLOYMENT_ID" ]; then
    DEPLOYMENT=$(curl -sf \
      -H "Authorization: Bearer $NOSANA_API_KEY" \
      "https://dashboard.k8s.prd.nos.ci/api/deployments/$NOSANA_DEPLOYMENT_ID" 2>/dev/null)
    CREDITS=$(curl -sf \
      -H "Authorization: Bearer $NOSANA_API_KEY" \
      "https://dashboard.k8s.prd.nos.ci/api/credits" 2>/dev/null)
    UPDATED=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    printf '{"deployment":%s,"credits":%s,"updatedAt":"%s"}' \
      "${DEPLOYMENT:-null}" "${CREDITS:-null}" "$UPDATED" \
      > /app/frontend/out/nosana-status.json 2>/dev/null
  fi
  sleep 60
done) &

# Restart ElizaOS automatically if it crashes
(while true; do
  elizaos start
  echo "[PROBE] ElizaOS exited, restarting in 5s..."
  sleep 5
done) &

nginx -g 'daemon off;'
