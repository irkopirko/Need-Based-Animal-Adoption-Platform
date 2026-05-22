#!/usr/bin/env bash
# Stops whatever is listening on port 8080 (IntelliJ, mvnw, or old terminal runs).
set -e
cd "$(dirname "$0")"

PIDS=$(lsof -ti :8080 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  echo "Stopping process(es) on port 8080: $PIDS"
  kill $PIDS 2>/dev/null || true
  sleep 2
  if lsof -ti :8080 >/dev/null 2>&1; then
    echo "Still busy; force kill..."
    kill -9 $(lsof -ti :8080) 2>/dev/null || true
    sleep 1
  fi
else
  echo "Port 8080 is already free."
fi

# Orphan mvnw spring-boot:run (parent may survive after killing the child on 8080)
pkill -f 'Need-Based-Animal-Adoption-Platform/backend.*spring-boot:run' 2>/dev/null || true
pkill -f 'adoption-platform-backend.*spring-boot:run' 2>/dev/null || true

if lsof -ti :8080 >/dev/null 2>&1; then
  echo "WARNING: Port 8080 is still in use:"
  lsof -i :8080 2>/dev/null || true
  exit 1
fi
echo "Done. You can Run BackendApplication in IntelliJ now."
