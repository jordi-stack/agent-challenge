#!/bin/sh
# Restart ElizaOS automatically if it crashes
(while true; do
  elizaos start
  echo "[PROBE] ElizaOS exited, restarting in 5s..."
  sleep 5
done) &

nginx -g 'daemon off;'
