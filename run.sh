#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PROJECT="$ROOT/mc1211-browser-research"

echo "========================================"
echo " Minecraft 1.21.1 Browser Port Lab"
echo "========================================"

cd "$PROJECT"

echo "[1/3] Building Java-to-JavaScript output..."
./gradlew clean war

echo "[2/3] Preparing website..."
rm -rf dist
mkdir -p dist

WAR="$(find build/libs -maxdepth 1 -type f -name '*.war' -print -quit)"
if [ -z "$WAR" ]; then
    echo "ERROR: Gradle did not produce a WAR file."
    exit 1
fi

(
    cd dist
    jar -xf "../$WAR"
)

if [ ! -s dist/index.html ] || [ ! -s dist/js/feasibility.js ]; then
    echo "ERROR: Website or compiled JavaScript is missing."
    exit 1
fi

echo "[3/3] Starting browser test server..."
echo "Open the Replit web preview on port 5000."
echo "Press Ctrl+C to stop the server."

exec python3 -m http.server 5000 \
    --bind 0.0.0.0 \
    --directory dist
