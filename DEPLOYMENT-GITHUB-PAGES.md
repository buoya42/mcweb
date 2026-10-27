# MC Browser — GitHub Pages deployment

This repository hosts a launcher page. It does not distribute Minecraft's compiled client code or game assets and does not run a game server.

## Deploy

1. In GitHub, open **Settings → Pages** and select **GitHub Actions** as the source.
2. Push to `main`; the Pages workflow builds the legacy Prismarine assets and publishes the site.
3. On the title screen, **Minecraft Java 26.3** opens the community-maintained Gaius browser port at:
   https://typethe0ry.github.io/Gaius/Gaius-26.3.html

The real Java client runs on the Gaius page, not in this repository's bundle. Browser worlds are stored under the Gaius page's browser origin.

## Multiplayer

For Minecraft Java multiplayer in Gaius, use a compatible RelayNode or install the Gaius Paper plugin on a server you control, as documented upstream:
https://github.com/TypeThe0ry/Gaius

The legacy **Prismarine (experimental)** screen remains separate and requires its own reachable WebSocket-to-TCP bridge and Minecraft server. GitHub Pages cannot host a TCP/WebSocket relay or Minecraft server itself.

## Licensing and security

Gaius is unofficial and is not endorsed by Mojang or Microsoft. Do not copy its compiled HTML client into this repository: its own documentation notes that compiled Minecraft code and assets remain Mojang/Microsoft property. Never publish bridge secrets, account tokens, or world files.
