# MC Browser

MC Browser is a small launcher for community-maintained Minecraft browser clients. It does not bundle or redistribute a compiled Minecraft game client.

## Play inside MC Browser

The title screen has two Eaglercraft launch options:

- **Eaglercraft 26.2** — loads the upstream browser client inside the MC Browser page where the upstream site's framing policy allows it.
- **EaglercraftX 1.8.8 (WASM-GC)** — opens the older browser client in the same embedded game view.

The game view includes **Open separately**, **Fullscreen**, and **Back** controls. If the upstream site blocks iframe embedding or browser storage is restricted, use **Open separately**. That opens the client directly at its own site origin, which is also the more reliable option for browser-local world saves.

Upstream pages:
- Eaglercraft 26.2: https://dev.eaglercraft.com/play?version=26.2
- EaglercraftX 1.8.8: https://dev.eaglercraft.com/play?version=1.8.8-wasm
- Offline downloads: https://dev.eaglercraft.com/downloads

## Experimental Prismarine client

**Prismarine (experimental)** opens the legacy Mineflayer/prismarine-viewer client. It connects to compatible Minecraft servers through a separately hosted WebSocket-to-TCP bridge; it is not the complete Java client.

## Why the actual game is loaded upstream

The repository contains the launcher/integration code, not a compiled copy of Minecraft. Educational intent does not itself grant permission to redistribute proprietary game files. Mojang's [Usage Guidelines](https://www.minecraft.net/en-us/usage-guidelines) say not to redistribute Minecraft games or altered game files without permission. The iframe keeps the client served from its upstream site instead of republishing the compiled game in this repository.

The game is a community port, not an official Mojang/Microsoft release. Feature parity, browser storage, online services, and embedding are controlled by the upstream client and browser.

## Deploy

Configure **Settings → Pages → Build and deployment → GitHub Actions**. The existing workflow builds and publishes this launcher. See [DEPLOYMENT-GITHUB-PAGES.md](DEPLOYMENT-GITHUB-PAGES.md).

MC Browser is unofficial and is not affiliated with or endorsed by Mojang Studios or Microsoft.
