const { LitElement, html, css } = require('lit')
const { commonCss, displayScreen } = require('./components/common')

class PlayScreen extends LitElement {
  static get styles () {
    return css`
      ${commonCss}
      :host {
        position: fixed;
        inset: 0;
        z-index: 20;
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
        width: min(660px, calc(100vw - 24px));
        max-height: calc(100vh - 24px);
        overflow: auto;
        box-sizing: border-box;
        padding: 10px;
        background: #c6c6c6;
        color: #222;
        border: 2px solid #171717;
        outline: 1px solid #c8c8c8;
        box-shadow: inset 2px 2px #fff, inset -2px -2px #555, 0 8px #0008;
      }
      h2 { margin: 0 0 6px; padding: 9px; font-size: 19px; text-align: center; color: #fff; background: #555; text-shadow: 2px 2px #222; }
      .subtitle { text-align: center; color: #333; font-size: 12px; margin: 0 0 12px; }
      .modes { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 6px; margin-bottom: 12px; }
      button, input, select {
        box-sizing: border-box;
        font: inherit;
        color: white;
        background: linear-gradient(#777, #555);
        border: 2px solid #222;
        border-radius: 0;
        box-shadow: inset 2px 2px #bbb, inset -2px -2px #3b3b3b;
        padding: 8px;
        min-width: 0;
      }
      button { cursor: pointer; text-shadow: 1px 1px #222; }
      button:hover, button:focus-visible { background: linear-gradient(#8cbde0, #527fa0); outline: 2px solid white; outline-offset: 1px; }
      button.active { background: linear-gradient(#8cbde0, #527fa0); border-color: white; }
      .fields { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
      .field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
      .field span { font-size: 12px; color: #333; }
      input, select { width: 100%; color: #222; background: #fff; border: 2px solid #555; box-shadow: inset 2px 2px #bbb; }
      input:disabled { opacity: .65; }
      .section { margin: 12px 0 6px; color: #333; font-size: 12px; text-transform: uppercase; }
      .note { margin-top: 12px; padding: 9px; border: 2px solid #333; background: #888; color: white; font-size: 12px; line-height: 1.5; }
      .status { margin-top: 10px; color: #842d25; font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
      .saved { display: grid; grid-template-columns: minmax(0,1fr) auto auto; gap: 6px; margin: 6px 0; align-items: center; }
      .saved-name { overflow-wrap: anywhere; font-size: 12px; color: #fff; }
      .actions { display: flex; justify-content: center; gap: 7px; flex-wrap: wrap; margin-top: 14px; }
      .actions button { min-width: 100px; }
      .primary { background: linear-gradient(#739b55, #4c7435); }
      .muted { color: #333; font-size: 11px; margin-top: 10px; line-height: 1.5; }
      @media (max-width: 520px) {
        .panel { padding: 8px; }
        .modes { grid-template-columns: repeat(2, minmax(0,1fr)); }
        .fields { grid-template-columns: minmax(0,1fr); }
        h2 { font-size: 16px; }
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

    const storedMode = storage.getItem('mcMode')
    this.mode = ['multiplayer', 'lan', 'via-proxy'].includes(storedMode) ? storedMode : 'multiplayer'
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

    if (this.server === '127.0.0.1' && this.serverport === '25568') {
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
    this.mode = ['multiplayer', 'lan', 'via-proxy'].includes(entry.mode) ? entry.mode : 'multiplayer'
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
    const host = this.server.trim()
    const port = Number(this.serverport) || 25565
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
      this.statusMessage = 'Enter the private access token configured by your WebSocket bridge host.'
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
        botVersion: this.version || '26.1'
      }
    }))
  }

  render () {
    const modeNote = {
      multiplayer: 'Connect to a reachable Java server. The browser protocol is currently set to 26.1. For a 26.3 target, use a ViaProxy endpoint configured to translate to 26.3.',
      lan: 'A browser cannot directly connect to a normal Java server over raw TCP. Use a secure WebSocket bridge reachable from this page and configured to reach your LAN server; do not publish a private LAN address.',
      'via-proxy': 'Enter the TCP address of your ViaProxy listener here. The WebSocket bridge below is a separate service and is not the version translator.'
    }[this.mode]

    const serverLabel = this.mode === 'lan'
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
              @click=${() => id === 'singleplayer' ? window.open('https://dev.eaglercraft.com/play?version=26.3', '_blank', 'noopener,noreferrer') : this.setMode(id)}>${label}</button>
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
            Connect
          </button>
          <button @click=${() => this.saveServer()}>Save Server</button>
          <button @click=${() => displayScreen(this, document.getElementById('title-screen'))}>Back</button>
        </div>

        <p class="muted">
          Multiplayer connects through a separately hosted WebSocket bridge. This browser client is not the official Minecraft Java client, and online-mode authentication support is limited.
        </p>
      </main>
    `
  }
}

window.customElements.define('pmui-playscreen', PlayScreen)
