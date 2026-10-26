import json
import re
import zipfile
from pathlib import Path

root = Path.home() / "workspace"
lab = root / "mc1211-port-lab"
jar = root / "private-minecraft" / "1.21.1.jar"
meta = root / "private-minecraft" / "1.21.1.json"
mappings = lab / "inputs" / "client-mappings.txt"

for path in (jar, meta, mappings):
    if not path.exists():
        raise SystemExit(f"Missing required file: {path}")

data = json.loads(meta.read_text())

# Official mappings: readable class name -> obfuscated class name.
name_map = {}
for line in mappings.read_text(errors="replace").splitlines():
    match = re.match(r"^(\S+) -> (\S+):$", line)
    if match:
        readable, obfuscated = match.groups()
        name_map[readable] = obfuscated

wanted = [
    data.get("mainClass", "net.minecraft.client.main.Main"),
    "net.minecraft.client.Minecraft",
    "net.minecraft.client.Options",
    "net.minecraft.client.KeyboardHandler",
    "net.minecraft.client.MouseHandler",
    "com.mojang.blaze3d.platform.Window",
    "com.mojang.blaze3d.platform.GlStateManager",
    "com.mojang.blaze3d.systems.RenderSystem",
]

with zipfile.ZipFile(jar) as archive:
    entries = set(archive.namelist())

    print("Minecraft:", data.get("id"))
    print("\nStartup classes (official name -> JAR entry):")
    for readable in wanted:
        obfuscated = name_map.get(readable)
        candidates = []
        if obfuscated:
            candidates.append(obfuscated.replace(".", "/") + ".class")
        candidates.append(readable.replace(".", "/") + ".class")

        found = next((p for p in candidates if p in entries), None)
        print(f"  {readable}")
        print(f"    mapped: {obfuscated or 'not found in mappings'}")
        print(f"    JAR:    {found or 'NOT FOUND'}")

    print("\nBundled texture checks:")
    for name in (
        "version.json",
        "assets/minecraft/textures/block/stone.png",
        "assets/minecraft/textures/block/grass_block_top.png",
    ):
        print(f"  {'FOUND' if name in entries else 'missing'} {name}")

asset_index = data.get("assetIndex", {})
print("\nOfficial asset index:")
print("  ID:", asset_index.get("id", "not specified"))
print("  URL:", asset_index.get("url", "not specified"))
print("  SHA-1:", asset_index.get("sha1", "not specified"))
print("  Size:", asset_index.get("size", "not specified"))

print("\nLibraries declared by launcher metadata:",
      len(data.get("libraries", [])))
print("\nReport directory:", lab / "reports")
