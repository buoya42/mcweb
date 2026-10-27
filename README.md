# MC Browser

MC Browser is a small launcher/portal for a real Minecraft Java Edition browser port, with the older Prismarine-based browser client retained as an experimental option.

## Play real Minecraft Java in your browser

**Choose “Minecraft Java 26.3” on the title screen**, or open the upstream browser client directly:

https://typethe0ry.github.io/Gaius/Gaius-26.3.html

The linked [Gaius project](https://github.com/TypeThe0ry/Gaius) runs the Minecraft Java client bytecode in the browser and runs its integrated singleplayer server in a browser Worker. Its singleplayer world storage stays in that browser profile. The game is hosted by Gaius, not packaged in this repository; this project does not copy or redistribute its compiled game client or assets.

Gaius is an unofficial community project, not an official Mojang or Microsoft product. Its current release notes identify Minecraft 26.2 and 26.3 browser clients. Review its notes and limitations before relying on it.

## Multiplayer

For authentic Java client multiplayer, use the multiplayer screen in Gaius. The server must be reachable through a compatible RelayNode or the Gaius Paper plugin because browsers cannot open raw Minecraft TCP connections directly. See the [Gaius project documentation](https://github.com/TypeThe0ry/Gaius) for setup and compatibility details.

The separate **Prismarine (experimental)** option in MC Browser is the legacy Mineflayer/prismarine-viewer client. It is not the complete official Java client and still needs a compatible WebSocket-to-TCP bridge and Minecraft server.

## Hosting this portal

This repository can be hosted on GitHub Pages. The portal itself does not need Replit, and it does not run a Minecraft server. The real Java browser port is opened from Gaius's hosted page so that this repository does not redistribute Mojang game code or assets.

See [GitHub Pages deployment](DEPLOYMENT-GITHUB-PAGES.md).

## Important notes

- Worlds created in Gaius are saved by that site/browser origin. They are not shared with this portal's origin or with the Prismarine client.
- Clear browser data only after exporting/backing up worlds if the client supports a suitable export path.
- Minecraft is owned by Mojang Studios/Microsoft. MC Browser and Gaius are unofficial and are not affiliated with or endorsed by them.
