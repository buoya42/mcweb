import json
import urllib.request
from pathlib import Path

root = Path.home() / "workspace"
private = root / "private-minecraft"
metadata = json.loads(
    (private / "1.21.1.json").read_text()
)

asset_info = metadata["assetIndex"]
index_path = private / f"asset-index-{asset_info['id']}.json"

if not index_path.exists():
    request = urllib.request.Request(
        asset_info["url"],
        headers={"User-Agent": "MinecraftBrowserPortResearch/1.0"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        raw = response.read()

    import hashlib
    actual_hash = hashlib.sha1(raw).hexdigest()
    if actual_hash != asset_info["sha1"]:
        raise SystemExit(
            f"Asset index SHA-1 mismatch: {actual_hash}"
        )

    index_path.write_bytes(raw)

index = json.loads(index_path.read_text())
objects = index.get("objects", {})

print("Asset index:", asset_info["id"])
print("Total indexed assets:", len(objects))
print("Saved privately to:", index_path)
print("\nSelected asset entries:")

targets = [
    "minecraft/textures/block/stone.png",
    "minecraft/textures/block/grass_block_top.png",
    "minecraft/textures/gui/widgets.png",
    "minecraft/textures/gui/title/background/panorama_0.png",
    "minecraft/sounds.json",
]

for name in targets:
    obj = objects.get(name)
    if obj:
        digest = obj["hash"]
        url = f"https://resources.download.minecraft.net/{digest[:2]}/{digest}"
        print(f"\nFOUND: {name}")
        print("  SHA-1:", digest)
        print("  Size:", obj.get("size"))
        print("  Official object URL:", url)
    else:
        print(f"\nNOT IN INDEX: {name}")

print("\nIndex virtual flag:", index.get("virtual", False))
