const { LitElement, html, css } = require('lit')
const { commonCss, displayScreen } = require('./components/common')

class PlayScreen extends LitElement {
  static get styles () {
    return css`
      ${commonCss}
      :host {
        position: absolute;
        inset: 0;
        display: block;
        color: white;
        font-family: Minecraft, mojangles, monospace;
      }
      .dirt-bg { transform: none; }
      .panel {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(760px, calc(100vw - 24px));
        max-height: calc(100vh - 24px);
        overflow: auto;
        box-sizing: border-box;
        padding: 18px;
        background: rgba(12, 15, 23, .94);
        border: 1px solid #969da9;
        box-shadow: 0 18px 60px #0009;
      }
      h2 { margin: 0 0 6px; font-size: 20px; text-align: center; }
      .subtitle { text-align: center; color: #b8c7d9; font-size: 12px; margin: 0 0 16px; }
      .modes { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 6px; margin-bottom: 16px; }
      button, input, select {
        box-sizing: border-box;
        font: inherit;
        color: white;
        background: #202837;
        border: 1px solid #647087;
        border-radius: 3px;
        padding: 10px;
        min-width: 0;
      }
      button { cursor: pointer; }
      button:hover, button:focus-visible { background: #34445e; border-color: #c8dcff; }
      button.active { background: #315d76; border-color: #9de5ff; }
      .fields { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
      .field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
      .field span { font-size: 12px; color: #c8d5e7; }
      input, select { width: 100%; }
      input:disabled { opacity: .65; }
      .section { margin: 13px 0 6px; color: #9de5ff; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
      .note {
        margin-top: 14px; padding: 10px; border-left: 3px solid #6fc3e4;
        background: #1c2938; color: #d5e5f6; font-size: 12px; line-height: 1.55;
      }
      .status { margin-top: 10px; color: #ffd18a; font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
      .saved { display: grid; grid-template-columns: minmax(0,1fr) auto auto; gap: 6px; margin: 6px 0; align-items: center; }
      .saved-name { overflow-wrap: anywhere; font-size: 12px; }
      .actions { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
      .actions button { min-width: 120px; }
      .primary { background: #245875; border-color: #9de5ff; }
      .muted { color: #a9b5c7; font-size: 11px; margin-top: 10px; line-height: 1.5; }
      @media (max-width: 520px) {
        .panel { padding: 12px; }
        .modes { grid-template-columns: repeat(2, minmax(0,1fr)); }
        .fields { grid-template-columns: minmax(0,1fr); }
        h2 { font-size: 17px; }
      }
    `
  }

  static get properties () {
    return {
      mode: { type: String },
      server: { type: String },
      serverport: { type: String },
      bridgeHost: { type: String },
      bridgePort: { type: String },
      bridgeToken: { type: String },
      username: { type: String },
      version: { type: String },
      savedServers: { state: true },
      statusMessage: { state: true }
    }
  }

  constructor () {
    super()
    const storage = window.localStorage

    this.mode = storage.getItem('mcMode') || 'multiplayer'
    this.server = storage.getItem('server') || ''
    this.serverport = storage.getItem('serverport') || '25565'
    this.bridgeHost = storage.getItem('bridgeHost') || ''
    this.bridgePort = storage.getItem('bridgePort') || ''
    this.bridgeToken = storage.getItem('mcBridgeToken') || ''
    this.username = storage.getItem('username') || 'BrowserPlayer'

    const oldVersion = storage.getItem('version')
    this.version = (!oldVersion || oldVersion === '1.18.2') ? '26.1' : oldVersion

    try {
      this.savedServers = JSON.parse(storage.getItem('mcSavedServers') || '[]')
      if (!Array.isArray(this.savedServers)) this.savedServers = []
    } catch {
      this.savedServers = []
    }

    this.statusMessage = ''

    window.fetch('./config.json')
      .then(res => res.json())
      .then(config => {
        if (!this.bridgeHost && config.defaultProxy) this.bridgeHost = config.defaultProxy
        if (!this.bridgePort && config.defaultProxyPort) this.bridgePort = String(config.defaultProxyPort)
        if (!this.server && config.defaultHost) this.server = config.defaultHost
        if (!this.serverport) this.serverport = String(config.defaultHostPort || 25565)
        this.requestUpdate()
      })
      .catch(() => {})
  }

  setMode (mode) {
    this.mode = mode
    window.localStorage.setItem('mcMode', mode)

    if (mode === 'singleplayer') {
      this.server = '127.0.0.1'
      this.serverport = '25568'
      this.version = '26.1'
    } else if (this.server === '127.0.0.1' && this.serverport === '25568') {
      this.server = ''
      this.serverport = mode === 'via-proxy' ? '25568' : '25565'
    }
    this.statusMessage = ''
    this.requestUpdate()
  }

  saveServer () {
    const host = this.server.trim()
    const port = Number(this.serverport) || 25565
    if (!host) {
      this.statusMessage = 'Enter a server host before saving it.'
      return
    }

    const entry = {
      name: `${host}:${port}`,
      host,
      port,
      version: this.version || '26.1',
      mode: this.mode
    }

    this.savedServers = [
      ...this.savedServers.filter(s => s.name !== entry.name),
      entry
    ].slice(-20)

    window.localStorage.setItem('mcSavedServers', JSON.stringify(this.savedServers))
    this.statusMessage = `Saved ${entry.name}`
  }

  loadServer (entry) {
    this.mode = entry.mode || 'multiplayer'
    this.server = entry.host
    this.serverport = String(entry.port)
    this.version = entry.version || '26.1'
    window.localStorage.setItem('mcMode', this.mode)
    this.requestUpdate()
  }

  removeServer (index) {
    this.savedServers = this.savedServers.filter((_, i) => i !== index)
    window.localStorage.setItem('mcSavedServers', JSON.stringify(this.savedServers))
    this.requestUpdate()
  }

  connect () {
    const singleplayer = this.mode === 'singleplayer'
    const host = singleplayer ? '127.0.0.1' : this.server.trim()
    const port = singleplayer ? 25568 : (Number(this.serverport) || 25565)
    const username = this.username.trim()
    const token = this.bridgeToken.trim()

    if (!host) {
      this.statusMessage = 'Enter a server address first.'
      return
    }
    if (!username || username.length > 16) {
      this.statusMessage = 'Use a username between 1 and 16 characters.'
      return
    }
    if (!token) {
      this.statusMessage = 'Bridge access is protected. Paste the token from .mc-bridge-token in this Replit workspace.'
      return
    }

    const bridgeHost = this.bridgeHost.trim()
    const bridgePort = this.bridgePort.trim()
    const bridge = bridgeHost
      ? `${bridgeHost}${bridgePort ? `:${bridgePort}` : ''}`
      : ''

    window.localStorage.setItem('username', username)
    window.localStorage.setItem('server', host)
    window.localStorage.setItem('serverport', String(port))
    window.localStorage.setItem('version', this.version || '26.1')
    window.localStorage.setItem('bridgeHost', bridgeHost)
    window.localStorage.setItem('bridgePort', bridgePort)
    window.localStorage.setItem('mcBridgeToken', token)

    this.dispatchEvent(new window.CustomEvent('connect', {
      detail: {
        server: `${host}:${port}`,
        proxy: bridge,
        bridgeToken: token,
        username,
        password: '',
        botVersion: singleplayer ? '26.1' : (this.version || '26.1')
      }
    }))
  }

  render () {
    const modeNote = {
      singleplayer: 'Connects to the Minecraft 26.3 world hosted inside this Replit workspace. Run scripts/start-hosted-world.sh first; this is a hosted server, not the official Java client’s integrated singleplayer.',
      multiplayer: 'Connect to a reachable Java server. The browser protocol is currently set to 26.1. For a 26.3 target, use a ViaProxy endpoint configured to translate to 26.3.',
      lan: 'For LAN servers, the TCP bridge must run on the same LAN as the server. A bridge running only in Replit cannot reach your home’s private 192.168.x.x network. Run this web client/bridge inside that LAN, or provide a reachable secure bridge.',
      'via-proxy': 'Enter the TCP address of your ViaProxy listener here. The WebSocket bridge below is a separate service and is not the version translator.'
    }[this.mode]

    const serverLabel = this.mode === 'singleplayer'
      ? 'Hosted world address'
      : this.mode === 'lan'
        ? 'LAN server host / IP'
        : this.mode === 'via-proxy'
          ? 'ViaProxy listener host'
          : 'Minecraft server host'

    return html`
      <div class="dirt-bg"></div>
      <main class="panel">
        <h2>MC Browser <span style="color:#9de5ff">v0.2.0</span></h2>
        <p class="subtitle">Choose how to connect</p>

        <div class="modes">
          ${[
            ['singleplayer', 'Singleplayer'],
            ['multiplayer', 'Multiplayer'],
            ['lan', 'LAN'],
            ['via-proxy', 'ViaProxy']
          ].map(([id, label]) => html`
            <button class="${this.mode === id ? 'active' : ''}"
              @click=${() => this.setMode(id)}>${label}</button>
          `)}
        </div>

        <div class="section">Connection</div>
        <div class="fields">
          <label class="field">
            <span>${serverLabel}</span>
            <input .value=${this.server}
              ?disabled=${this.mode === 'singleplayer'}
              placeholder=${this.mode === 'singleplayer' ? '127.0.0.1' : 'play.example.net'}
              @input=${e => { this.server = e.target.value }} />
          </label>
          <label class="field">
            <span>Port</span>
            <input type="number" min="1" max="65535"
              .value=${String(this.mode === 'singleplayer' ? 25568 : this.serverport)}
              ?disabled=${this.mode === 'singleplayer'}
              @input=${e => { this.serverport = e.target.value }} />
          </label>
          <label class="field">
            <span>Username</span>
            <input .value=${this.username} maxlength="16"
              autocomplete="off"
              @input=${e => { this.username = e.target.value }} />
          </label>
          <label class="field">
            <span>Browser protocol version</span>
            <select .value=${this.version}
              @change=${e => { this.version = e.target.value }}>
              <option value="26.1">26.1 (recommended)</option>
              <option value="1.21.11">1.21.11</option>
              <option value="1.21.10">1.21.10</option>
              <option value="1.21.4">1.21.4</option>
              <option value="">Auto-detect</option>
            </select>
          </label>
        </div>

        <div class="section">WebSocket ↔ TCP bridge</div>
        <div class="fields">
          <label class="field">
            <span>Bridge host (blank = this app)</span>
            <input .value=${this.bridgeHost} placeholder="your-bridge.example.net"
              @input=${e => { this.bridgeHost = e.target.value }} />
          </label>
          <label class="field">
            <span>Bridge port (optional)</span>
            <input type="number" min="1" max="65535" .value=${this.bridgePort}
              placeholder="Default for this connection"
              @input=${e => { this.bridgePort = e.target.value }} />
          </label>
          <label class="field" style="grid-column:1 / -1">
            <span>Bridge access token</span>
            <input type="password" .value=${this.bridgeToken}
              autocomplete="off" placeholder="Paste your private bridge token"
              @input=${e => { this.bridgeToken = e.target.value }} />
          </label>
        </div>

        <div class="note">${modeNote}</div>

        ${this.savedServers.length ? html`
          <div class="section">Saved servers</div>
          ${this.savedServers.map((s, i) => html`
            <div class="saved">
              <span class="saved-name">${s.name}</span>
              <button @click=${() => this.loadServer(s)}>Load</button>
              <button @click=${() => this.removeServer(i)}>Remove</button>
            </div>
          `)}
        ` : ''}

        ${this.statusMessage ? html`<div class="status">${this.statusMessage}</div>` : ''}

        <div class="actions">
          <button class="primary" @click=${() => this.connect()}>
            ${this.mode === 'singleplayer' ? 'Join Hosted World' : 'Connect'}
          </button>
          ${this.mode !== 'singleplayer'
            ? html`<button @click=${() => this.saveServer()}>Save Server</button>`
            : ''}
          <button @click=${() => displayScreen(this, document.getElementById('title-screen'))}>Back</button>
        </div>

        <p class="muted">
          This is a Mineflayer-based browser client, not the complete official Java client.
          Online-mode servers may require authentication this client does not provide.
        </p>
      </main>
    `
  }
}

window.customElements.define('pmui-playscreen', PlayScreen)
