# MC Browser

MC Browser is a lightweight launcher for community-maintained Minecraft browser clients. It does not bundle or redistribute a Minecraft game client.

## Launch a browser client

- **Eaglercraft 26.2** — the newest recent-version browser option verified on the Eaglercraft site: https://dev.eaglercraft.com/play?version=26.2
- **EaglercraftX 1.8.8 (WASM-GC)** — the long-established browser port: https://dev.eaglercraft.com/play?version=1.8.8-wasm
- **Prismarine (experimental)** — the legacy Mineflayer/prismarine-viewer client included in this repository. It connects to a Minecraft server through a compatible WebSocket-to-TCP bridge; it is not the full Java client.

Eaglercraft's current site also provides offline downloads and documents browser-stored worlds and Shared Worlds. See its [offline downloads](https://dev.eaglercraft.com/downloads) and [getting-started guide](https://dev.eaglercraft.com/guide).

## Important differences

Eaglercraft is a community port, not an official Mojang/Microsoft release. The active site currently exposes version 26.2, 1.8.8 and 1.12.2; do not assume that every latest-version Java feature, mod loader, server or LAN capability is supported. The project's documented singleplayer and world import/export details are clearest for EaglercraftX 1.8.8. Shared worlds use Eaglercraft's relay flow rather than a browser directly listening as a normal Minecraft TCP server.

Worlds saved on the Eaglercraft site are stored under that site's browser origin. They are not shared automatically with this launcher or Prismarine.

## Why the game opens on its upstream site

GitHub Pages hosts this launcher only. Mojang's [Minecraft Usage Guidelines](https://www.minecraft.net/en-us/usage-guidelines) say not to redistribute Minecraft or altered game files. Therefore this repository links to the upstream browser client instead of copying compiled game files or Mojang assets into our public Pages build. This also avoids making our launcher depend on a bundled copy that could be removed.

## Deploy MC Browser

Configure **Settings → Pages → Build and deployment → GitHub Actions**. The existing workflow builds and publishes the launcher. See [DEPLOYMENT-GITHUB-PAGES.md](DEPLOYMENT-GITHUB-PAGES.md).

## Credits

- [Eaglercraft](https://dev.eaglercraft.com/) and its community contributors for browser Minecraft ports.
- [PrismarineJS/prismarine-web-client](https://github.com/PrismarineJS/prismarine-web-client) for the experimental network client retained in this repository.

MC Browser is unofficial and is not affiliated with or endorsed by Mojang Studios or Microsoft.
