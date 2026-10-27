# MC Browser — GitHub Pages deployment

GitHub Pages hosts the static browser UI. It does not run Node.js, a Minecraft
server, or the TCP/WebSocket bridge.

1. Push this source to a repository you own.
2. In GitHub, open Settings → Pages and select GitHub Actions as the source.
3. Push to main or master; the deployment workflow builds `public/` and publishes it.
4. Keep the Node.js bridge and Minecraft server on a separate running host.
5. In the web UI, enter the bridge host name (without https://), port 443 for
   an HTTPS-hosted bridge, and the private token from `.mc-bridge-token`.

Never commit `.mc-bridge-token`, Minecraft server JARs, or world data.
Do not put the bridge token into config.json or a public workflow.
