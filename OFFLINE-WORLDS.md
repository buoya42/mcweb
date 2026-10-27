# MC Browser offline worlds

The offline mode is a separate, browser-only voxel prototype. It does not start a Minecraft Java server and does not use the WebSocket bridge.

## Start playing

1. Open MC Browser and choose **Play**.
2. Choose **Singleplayer**.
3. Select **Create New World**, give it a name and seed, then choose **Create New World** again.
4. Click in the world to capture the mouse.

## Implemented in the offline prototype

- Deterministic, seed-based terrain generation in a bounded 48 × 48 block area.
- Creative building with grass, dirt and stone; left-click to break and right-click to place.
- Keyboard/mouse look, movement and flying.
- World list, create, delete, local saving, resume, and JSON export/import backups.
- World data and player position saved in browser IndexedDB. Terrain is regenerated from its seed; only edits and player data need to be stored.

## Controls

- Click the world to capture the mouse; press Escape to open the game menu.
- W / A / S / D: move.
- Mouse: look around.
- Space: fly up; Ctrl: fly down.
- Left click: break a block; right click: place a block.
- 1 / 2 / 3: choose grass, dirt or stone.
- Escape: pause; use **Save and Quit to Title** to leave.

## Current boundaries

This is not the official Minecraft Java engine. Survival mode, mobs, crafting, redstone, inventory mechanics, an infinite world and Minecraft Java save-file compatibility are not implemented. The generated offline world is a prototype and cannot be joined by a Minecraft Java client. Its data remains on the current browser profile; clearing browser data or using another browser/device can remove or hide those worlds, so export backups for important builds.

Multiplayer remains the existing Prismarine/Mineflayer browser client and still requires a compatible, reachable WebSocket-to-TCP bridge and a Minecraft server. GitHub Pages serves static files only; it does not run either service. A browser also cannot expose an ordinary raw TCP Minecraft LAN server by itself.
