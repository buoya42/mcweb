# MC Browser — GitHub Pages deployment

MC Browser is a static launcher for upstream browser Minecraft clients. It does not contain or serve a compiled Minecraft game client, Mojang assets, a Java server, or a TCP/WebSocket bridge.

## Deploy

1. Open the repository's **Settings → Pages**.
2. Select **GitHub Actions** as the Pages source.
3. Push to `main`; the deployment workflow builds and publishes the launcher.
4. Open the site. **Eaglercraft 26.2** and **EaglercraftX 1.8.8** launch on the upstream Eaglercraft site; **Prismarine (experimental)** opens the legacy connection UI.

## Why the game is upstream

Minecraft's published [Usage Guidelines](https://www.minecraft.net/en-us/usage-guidelines) state that Minecraft games and altered game files should not be redistributed without permission. This repository therefore links to the community-maintained Eaglercraft browser client rather than mirroring its compiled build or bundling Mojang game files. If upstream removes or changes a build, the linked version may change too.

- Eaglercraft 26.2: https://dev.eaglercraft.com/play?version=26.2
- EaglercraftX 1.8.8 (WASM-GC): https://dev.eaglercraft.com/play?version=1.8.8-wasm
- Eaglercraft offline downloads: https://dev.eaglercraft.com/downloads

## Data and multiplayer

Worlds created on Eaglercraft are stored under the Eaglercraft site's browser origin, not under this launcher's origin. Its Shared Worlds flow uses relays; browsers cannot expose a conventional Minecraft TCP server directly.

The legacy Prismarine option still needs a reachable WebSocket-to-TCP bridge and a compatible Minecraft server. GitHub Pages cannot run either service.

MC Browser is unofficial and is not affiliated with Mojang Studios or Microsoft.
