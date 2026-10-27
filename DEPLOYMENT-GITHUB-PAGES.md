# MC Browser — GitHub Pages deployment

MC Browser is a static launcher and does not contain a compiled Minecraft client or Mojang game assets.

## Deploy

1. Open **Settings → Pages** in this repository.
2. Select **GitHub Actions** as the Pages source.
3. Push to `main`; the Pages workflow builds and publishes the launcher.
4. Click **Eaglercraft 26.3**, **Eaglercraft 26.2**, or **EaglercraftX 1.8.8 (PBR)**. The game opens in a new tab.

## Why the game opens in a new tab

The upstream Eaglercraft site sends a frame policy that blocks third-party iframe embedding in many browsers. The launcher cannot override that response header. Game buttons therefore navigate directly to the upstream game in a new tab rather than showing a black embedded frame.

If no tab opens, allow pop-ups for your Pages site or use one of the direct game links in README.md. The upstream page may show a **Launch game** button after loading.

## Shaders

Eaglercraft documents built-in PBR shaders for EaglercraftX 1.8.8 at **Options → Shaders**, requiring WebGL 2 and floating-point render targets. Generic Java shader packs are not guaranteed to work on the 26.2/26.3 builds.

## Multiplayer

Eaglercraft's shared-world and relay features are managed by the upstream client. The legacy **Prismarine (experimental)** screen still needs a reachable WebSocket-to-TCP bridge and a compatible Minecraft server. GitHub Pages cannot run either service.

MC Browser is unofficial and is not affiliated with Mojang Studios or Microsoft.
