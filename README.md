# MC Browser

MC Browser is a Minecraft-style launcher for community-maintained browser clients. It does not bundle a compiled game client or Mojang game assets.

## Play in the launcher

- **Eaglercraft 26.3** — the current recent-version browser option listed by Eaglercraft.
- **Eaglercraft 26.2** — previous recent-version build.
- **EaglercraftX 1.8.8 (PBR shaders)** — older browser build with an explicitly documented built-in PBR shader option.
- **Prismarine (experimental)** — a Mineflayer/prismarine-viewer client that needs a compatible, reachable WebSocket-to-TCP bridge and Minecraft server.

The Eaglercraft versions open in a full-window embedded game view with a pixel-style toolbar. **Open separately** is always available if the upstream site refuses to embed, the game stays blank, or embedded storage behaves differently. The iframe is kept mounted when you press Back so reopening the same version does not force a new page load.

Upstream game links:
- Eaglercraft 26.3: https://dev.eaglercraft.com/play?version=26.3
- Eaglercraft 26.2: https://dev.eaglercraft.com/play?version=26.2
- EaglercraftX 1.8.8 WASM-GC: https://dev.eaglercraft.com/play?version=1.8.8-wasm
- Offline downloads: https://dev.eaglercraft.com/downloads

## Shaders and resource packs

The Eaglercraft page documents resource packs and describes built-in **PBR shaders for EaglercraftX 1.8** under **Options → Shaders**. That renderer requires WebGL 2 and floating-point render targets. This is not a guarantee that arbitrary OptiFine/Iris Java shader packs work in Eaglercraft 26.2 or 26.3. Use a recent browser and GPU drivers; if shader options are missing or disabled, use the standard renderer or try the upstream client's standalone page.

## Loading, storage and browser limits

The launcher shows loading feedback and keeps a persistent Open separately fallback. The browser may still block third-party iframe embedding or partition storage. Worlds and settings belong to the upstream Eaglercraft page's origin; they are not stored under MC Browser's origin. Use **Open separately** for the most reliable game loading and storage behavior if the embedded view acts oddly.

The online client is a community port, not an official Mojang/Microsoft release. This project only links to the upstream game page instead of republishing a compiled game client. See Mojang's [Usage Guidelines](https://www.minecraft.net/en-us/usage-guidelines).

## Deploy

Configure **Settings → Pages → Build and deployment → GitHub Actions**. The workflow builds and publishes the MC Browser launcher. See [DEPLOYMENT-GITHUB-PAGES.md](DEPLOYMENT-GITHUB-PAGES.md).

MC Browser is unofficial and is not affiliated with or endorsed by Mojang Studios or Microsoft.
