import re
from pathlib import Path

lab = Path.home() / "workspace" / "mc1211-port-lab"
mapping_file = lab / "inputs" / "client-mappings.txt"
dependency_file = lab / "reports" / "class-dependencies.txt"

if not mapping_file.exists() or not dependency_file.exists():
    raise SystemExit("Missing mappings or class-dependencies report. Run inspect.sh first.")

# Official mappings: readable.name -> obfuscatedName:
obfuscated_to_readable = {}
for line in mapping_file.read_text(errors="replace").splitlines():
    match = re.match(r"^(\S+) -> (\S+):$", line)
    if match:
        readable, obfuscated = match.groups()
        obfuscated_to_readable[obfuscated] = readable

api_prefixes = (
    "org.lwjgl.", "java.awt.", "javax.sound.",
    "javax.swing.", "com.sun.jna."
)
results = set()

for line in dependency_file.read_text(errors="replace").splitlines():
    if "->" not in line:
        continue

    parts = line.split()
    arrow = parts.index("->")
    if arrow == 0 or arrow + 1 >= len(parts):
        continue

    source = parts[arrow - 1]
    target = parts[arrow + 1]

    if not target.startswith(api_prefixes):
        continue

    readable = obfuscated_to_readable.get(source, source)
    results.add((readable, target))

report = lab / "reports" / "mapped-api-usage.txt"
with report.open("w") as f:
    for source, target in sorted(results):
        f.write(f"{source} -> {target}\n")

print(f"Mapped desktop/native API references: {len(results)}")
print(f"Saved: {report}\n")
for source, target in sorted(results):
    print(f"{source} -> {target}")
