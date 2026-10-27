#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME="$ROOT/runtime"
SERVER_DIR="$RUNTIME/minecraft-26.3"
PROXY_DIR="$RUNTIME/viaproxy"
mkdir -p "$SERVER_DIR" "$PROXY_DIR"

command -v curl >/dev/null || { echo "curl is required."; exit 1; }
command -v python3 >/dev/null || { echo "python3 is required."; exit 1; }

echo "Fetching Mojang version manifest..."
curl -fLsS --retry 3 \
  https://piston-meta.mojang.com/mc/game/version_manifest_v2.json \
  -o "$RUNTIME/version_manifest.json"

python3 - "$RUNTIME/version_manifest.json" > "$RUNTIME/26.3-version-url.txt" <<'PY'
import json, sys
data = json.load(open(sys.argv[1], encoding="utf-8"))
entry = next((v for v in data["versions"] if v["id"] == "26.3"), None)
if not entry:
    raise SystemExit("Minecraft 26.3 was not found in Mojang's version manifest.")
print(entry["url"])
PY

VERSION_URL="$(cat "$RUNTIME/26.3-version-url.txt")"
echo "Fetching official Minecraft 26.3 metadata..."
curl -fLsS --retry 3 "$VERSION_URL" -o "$SERVER_DIR/version.json"

python3 - "$SERVER_DIR/version.json" > "$SERVER_DIR/server-download.txt" <<'PY'
import json, sys
data = json.load(open(sys.argv[1], encoding="utf-8"))
download = data.get("downloads", {}).get("server")
if not download:
    raise SystemExit("Mojang metadata does not contain a server download.")
print(download["url"])
PY

python3 - "$SERVER_DIR/version.json" > "$SERVER_DIR/server-sha1.txt" <<'PY'
import json, sys
print(json.load(open(sys.argv[1], encoding="utf-8"))["downloads"]["server"]["sha1"])
PY

SERVER_URL="$(cat "$SERVER_DIR/server-download.txt")"
EXPECTED_SHA1="$(cat "$SERVER_DIR/server-sha1.txt")"

if [ ! -f "$SERVER_DIR/server.jar" ]; then
  echo "Downloading official Minecraft 26.3 server JAR..."
  curl -fL --retry 3 "$SERVER_URL" -o "$SERVER_DIR/server.jar.part"
  mv "$SERVER_DIR/server.jar.part" "$SERVER_DIR/server.jar"
fi

ACTUAL_SHA1="$(sha1sum "$SERVER_DIR/server.jar" | awk '{print $1}')"
if [ "$ACTUAL_SHA1" != "$EXPECTED_SHA1" ]; then
  echo "Minecraft server JAR SHA-1 verification failed."
  rm -f "$SERVER_DIR/server.jar"
  exit 1
fi
echo "Minecraft server JAR verified."

VP_JAR="$PROXY_DIR/ViaProxy-3.4.14.jar"
VP_URL="https://github.com/ViaVersion/ViaProxy/releases/download/v3.4.14/ViaProxy-3.4.14.jar"
VP_SHA256="2894bbfb2f4342f8fde887af6c689313efd5b0e46a8006775eea0e21e2948ab5"

if [ ! -f "$VP_JAR" ]; then
  echo "Downloading ViaProxy 3.4.14..."
  curl -fL --retry 3 "$VP_URL" -o "$VP_JAR.part"
  mv "$VP_JAR.part" "$VP_JAR"
fi

ACTUAL_SHA256="$(sha256sum "$VP_JAR" | awk '{print $1}')"
if [ "$ACTUAL_SHA256" != "$VP_SHA256" ]; then
  echo "ViaProxy SHA-256 verification failed."
  rm -f "$VP_JAR"
  exit 1
fi
echo "ViaProxy JAR verified."

if [ ! -f "$SERVER_DIR/server.properties" ]; then
  cat > "$SERVER_DIR/server.properties" <<'PROPS'
server-ip=127.0.0.1
server-port=25565
online-mode=false
enforce-secure-profile=false
white-list=false
max-players=8
motd=MC Browser hosted world
gamemode=survival
difficulty=normal
view-distance=6
simulation-distance=4
spawn-protection=0
enable-command-block=false
enable-rcon=false
PROPS
fi

if [ ! -f "$SERVER_DIR/eula.txt" ]; then
  printf 'eula=false\n' > "$SERVER_DIR/eula.txt"
fi

cat > "$RUNTIME/START-HERE.txt" <<'TXT'
MC Browser hosted Minecraft 26.3 world

1. Read the Minecraft EULA: https://aka.ms/MinecraftEULA
2. Only if you agree, change minecraft-26.3/eula.txt to eula=true.
3. Run: bash scripts/start-hosted-world.sh
4. In MC Browser choose Singleplayer -> Join Hosted World.

The server binds to loopback inside the Replit workspace. ViaProxy translates
the browser client's supported protocol to Minecraft 26.3. Server JARs and
world files stay in runtime/ and should not be pushed to GitHub.
TXT

echo
echo "Runtime downloads and integrity checks are complete."
echo "EULA status: $(tr -d '\r\n' < "$SERVER_DIR/eula.txt")"
echo "Read $RUNTIME/START-HERE.txt before starting the server."
