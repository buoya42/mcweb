#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME="$ROOT/runtime"
SERVER_DIR="$RUNTIME/minecraft-26.3"
PROXY_DIR="$RUNTIME/viaproxy"
LOG_DIR="$RUNTIME/logs"
mkdir -p "$LOG_DIR"

if [ -x "$HOME/workspace/toolchains/temurin-25/bin/java" ]; then
  JAVA="$HOME/workspace/toolchains/temurin-25/bin/java"
elif command -v java >/dev/null 2>&1; then
  JAVA="$(command -v java)"
else
  echo "Java 25 is required. Java was not found."
  exit 1
fi

if [ ! -f "$SERVER_DIR/server.jar" ] || [ ! -f "$PROXY_DIR/ViaProxy-3.4.14.jar" ]; then
  echo "Runtime downloads are missing. Run: bash scripts/setup-hosted-world.sh"
  exit 1
fi

if ! grep -Eq '^[[:space:]]*eula=true([[:space:]]*#.*)?$' "$SERVER_DIR/eula.txt" 2>/dev/null; then
  echo "Minecraft EULA has not been accepted."
  echo "Read https://aka.ms/MinecraftEULA first."
  echo "Only if you agree, run:"
  echo "  printf 'eula=true\n' > '$SERVER_DIR/eula.txt'"
  exit 1
fi

if [ -f "$SERVER_DIR/server.pid" ] && kill -0 "$(cat "$SERVER_DIR/server.pid")" 2>/dev/null; then
  echo "Minecraft server already running."
else
  echo "Starting Minecraft 26.3 server..."
  (cd "$SERVER_DIR" &&
    nohup "$JAVA" -Xms256M -Xmx1536M -jar server.jar nogui \
      > "$LOG_DIR/minecraft.log" 2>&1 < /dev/null &
    echo $! > "$SERVER_DIR/server.pid")
fi

echo "Starting ViaProxy: browser protocol 26.1 -> Minecraft 26.3..."
if [ -f "$PROXY_DIR/viaproxy.pid" ] && kill -0 "$(cat "$PROXY_DIR/viaproxy.pid")" 2>/dev/null; then
  echo "ViaProxy already running."
else
  (
    cd "$PROXY_DIR"
    nohup "$JAVA" -Xms128M -Xmx512M \
      -DskipUpdateCheck -DignoreSystemRequirements -Djava.awt.headless=true \
      -jar ViaProxy-3.4.14.jar cli \
      --bind-address 127.0.0.1:25568 \
      --target-address 127.0.0.1:25565 \
      --target-version 26.3 \
      > "$LOG_DIR/viaproxy.log" 2>&1 < /dev/null &
    echo $! > "$PROXY_DIR/viaproxy.pid"
  )
fi

sleep 3
echo
echo "===== SERVER LISTENERS ====="
ss -lnt 2>/dev/null | grep -E ':(25565|25568)[[:space:]]' || true
echo
echo "Logs:"
echo "  $LOG_DIR/minecraft.log"
echo "  $LOG_DIR/viaproxy.log"
echo
echo "Choose Singleplayer in the web client and click Join Hosted World."
