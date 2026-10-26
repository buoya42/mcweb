#!/usr/bin/env bash
set -euo pipefail

ROOT="$HOME/workspace"
JAR="$ROOT/private-minecraft/1.21.1.jar"
META="$ROOT/private-minecraft/1.21.1.json"
LAB="$ROOT/mc1211-port-lab"

if [[ ! -s "$JAR" || ! -s "$META" ]]; then
  echo "ERROR: Minecraft 1.21.1 JAR or metadata is missing."
  exit 1
fi

echo "=== Checking Minecraft version metadata ==="
python3 - "$META" <<'PY' > "$LAB/inputs/mappings-url.txt"
import json, sys
with open(sys.argv[1], encoding="utf-8") as f:
    d = json.load(f)
assert d.get("id") == "1.21.1", "Unexpected Minecraft version"
print(d["downloads"]["client_mappings"]["url"])
PY

echo "=== Downloading official client mappings ==="
curl -fL --retry 2 \
  "$(cat "$LAB/inputs/mappings-url.txt")" \
  -o "$LAB/inputs/client-mappings.txt"

echo "=== Checking JAR integrity ==="
jar tf "$JAR" > "$LAB/reports/jar-entries.txt"

python3 - "$LAB/reports/jar-entries.txt" <<'PY'
import sys
entries = open(sys.argv[1], encoding="utf-8").read().splitlines()
classes = [x for x in entries if x.endswith(".class")]
resources = len(entries) - len(classes)
print("Total entries:", len(entries))
print("Class files:", len(classes))
print("Other resources:", resources)
PY

echo "=== Recording dependency analysis ==="
jdeps --multi-release 21 --ignore-missing-deps \
  -summary "$JAR" \
  > "$LAB/reports/dependency-summary.txt" 2>&1 || true

jdeps --multi-release 21 --ignore-missing-deps \
  -verbose:class "$JAR" \
  > "$LAB/reports/class-dependencies.txt" 2>&1 || true

grep -E \
  'org\.lwjgl|java\.awt|javax\.sound|sun\.misc|java\.lang\.reflect|java\.lang\.ClassLoader' \
  "$LAB/reports/class-dependencies.txt" \
  > "$LAB/reports/desktop-api-usage.txt" || true

echo
echo "=== Dependency summary ==="
cat "$LAB/reports/dependency-summary.txt"

echo
echo "=== Desktop API references (first 100 matches) ==="
head -100 "$LAB/reports/desktop-api-usage.txt" || true

echo
echo "=== Reports created ==="
find "$LAB/reports" -maxdepth 1 -type f -printf '%f (%s bytes)\n'
echo
echo "Inspection finished. No game files were modified."
