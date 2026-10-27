# MC Browser

MC Browser is a Minecraft-style launcher for community browser clients.

## Launch a game

Choose one of the Eaglercraft buttons on the title screen. The game opens in a **new browser tab** because the upstream Eaglercraft site blocks being displayed inside third-party iframes in many browsers. This is enforced by the upstream site's frame policy; the launcher cannot override it.

- **Eaglercraft 26.3** — https://dev.eaglercraft.com/play?version=26.3
- **Eaglercraft 26.2** — https://dev.eaglercraft.com/play?version=26.2
- **EaglercraftX 1.8.8 (PBR)** — https://dev.eaglercraft.com/play?version=1.8.8-wasm

If a tab does not appear, allow pop-ups for this site or click the direct version link above. The upstream page may show a **Launch game** button after it loads; click that to start the client.

The upstream page documents singleplayer, browser-local worlds, world backups, shared-world invites, and resource packs. See [its offline downloads](https://dev.eaglercraft.com/downloads) and [getting-started guide](https://dev.eaglercraft.com/guide).

## Shaders

EaglercraftX 1.8.8 documents a built-in PBR shader renderer under **Options → Shaders**, requiring WebGL 2 and floating-point render targets. This does not mean arbitrary OptiFine/Iris shader packs work in Eaglercraft 26.2/26.3.

## Experimental Prismarine client

**Prismarine (experimental)** is the legacy Mineflayer/prismarine-viewer client included in this repository. It connects to compatible Minecraft servers through a separately hosted WebSocket-to-TCP bridge; it is not the complete Java client.

## Why the game opens separately

The launcher does not bundle a compiled Minecraft-derived game client. The upstream site blocks third-party iframe embedding, so the reliable browser-only integration is to open its game page directly. This repository contains launcher UI and integration code, not a redistributed game bundle.

Configure **Settings → Pages → Build and deployment → GitHub Actions** to deploy the launcher. See [DEPLOYMENT-GITHUB-PAGES.md](DEPLOYMENT-GITHUB-PAGES.md).

MC Browser is unofficial and is not affiliated with or endorsed by Mojang Studios or Microsoft.
