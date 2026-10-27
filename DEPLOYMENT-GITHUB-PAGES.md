# MC Browser — GitHub Pages deployment

MC Browser is a static launcher. The page includes a full-window game view that embeds the Eaglercraft browser page from its upstream origin when allowed; this repository does not copy or serve its compiled game client.

## Deploy

1. Open the repository's **Settings → Pages**.
2. Select **GitHub Actions** as the Pages source.
3. Push to `main`; the Pages workflow builds and publishes the launcher.
4. Open MC Browser and click **Eaglercraft 26.2**.

## Embedded game behavior

- The iframe loads `https://dev.eaglercraft.com/play?version=26.2`.
- **Open separately** launches the same game at its own site origin. Use it if embedding is blocked, or if you want the most predictable local-world storage behavior.
- **Fullscreen** asks the browser to fullscreen the embedded game; if that fails, the control opens the upstream page in a separate tab.
- The **Back** control closes the embedded view.

The upstream site controls whether its page may be embedded and how its client stores data. Third-party browser storage can be partitioned or restricted depending on browser settings.

## Why game files are not bundled here

This repository contains the launcher and integration code, not a redistributed compiled Minecraft client or game assets. Educational use alone does not grant permission to republish proprietary game files. Mojang's [Usage Guidelines](https://www.minecraft.net/en-us/usage-guidelines) state not to redistribute Minecraft games or altered game files without permission.

## Multiplayer

Eaglercraft's Shared Worlds / relay features are controlled by Eaglercraft itself. The legacy **Prismarine (experimental)** screen still requires a reachable WebSocket-to-TCP bridge and compatible Minecraft server. GitHub Pages cannot run either service.

MC Browser is unofficial and is not affiliated with Mojang Studios or Microsoft.
