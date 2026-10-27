# MC Browser — GitHub Pages deployment

MC Browser hosts a static launcher. The Eaglercraft game view loads the upstream browser client inside an iframe; this repository does not copy or serve compiled Minecraft game files.

## Deploy

1. Open **Settings → Pages** in this repository.
2. Select **GitHub Actions** as the Pages source.
3. Push to `main`; the deployment workflow builds and publishes the launcher.
4. Choose **Eaglercraft 26.3**, **Eaglercraft 26.2**, or **EaglercraftX 1.8.8 (PBR shaders)** from the Minecraft-style title screen.

## In-page game view

- The game iframe fills the viewport; the pixel-style toolbar floats at the top-left and does not reserve a permanent strip of game height.
- **Open separately** is the fallback if the iframe is blocked or remains blank.
- **Fullscreen** requests fullscreen on the game frame.
- **Back** hides the embedded screen without removing/recreating its iframe, so reopening the same version should not need a full reload.

An iframe cannot reliably report every cross-origin loading error. The presence of the toolbar does not prove the Minecraft runtime finished booting. If the game remains blank, use **Open separately**. Browser privacy settings may partition third-party storage; open the upstream game directly for the most reliable saves.

## Shader compatibility

Eaglercraft's current page documents built-in PBR shader support for EaglercraftX 1.8 under **Options → Shaders**. This requires WebGL 2 and floating-point render targets. Generic Minecraft Java shader packs are not automatically compatible with Eaglercraft, and the upstream documentation does not establish that arbitrary shader packs work on 26.2/26.3.

## Why game files are not bundled here

This repository contains launcher/integration code, not a redistributed compiled Minecraft client or game assets. Educational intent alone does not grant permission to republish proprietary game files. See Mojang's [Usage Guidelines](https://www.minecraft.net/en-us/usage-guidelines).

## Multiplayer

Eaglercraft's own shared-world and relay flows are managed by the upstream client. The legacy **Prismarine (experimental)** screen still needs its own reachable WebSocket-to-TCP bridge and compatible Minecraft server. GitHub Pages cannot run a Minecraft server or relay.

MC Browser is unofficial and is not affiliated with Mojang Studios or Microsoft.
