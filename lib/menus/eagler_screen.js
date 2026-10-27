const { LitElement, html, css } = require('lit')

const CLIENT_URLS = {
  '26.3': 'https://dev.eaglercraft.com/play?version=26.3',
  '26.2': 'https://dev.eaglercraft.com/play?version=26.2',
  '1.8.8-wasm': 'https://dev.eaglercraft.com/play?version=1.8.8-wasm'
}

class EaglerScreen extends LitElement {
  static get properties () {
    return {
      version: { type: String },
      active: { type: Boolean },
      frameSrc: { type: String },
      status: { type: String },
      showStatus: { type: Boolean }
    }
  }

  static get styles () {
    return css`
      :host {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: none;
        color: #fff;
        font-family: minecraft, mojangles, monospace;
      }

      * { box-sizing: border-box; }

      .shell {
        position: absolute;
        inset: 0;
        overflow: hidden;
        background: #000;
      }

      .game-frame {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        border: 0;
        background: #000;
      }

      .top-overlay {
        position: absolute;
        z-index: 2;
        top: 10px;
        left: 10px;
        width: auto;
        max-width: calc(100vw - 20px);
        padding: 0;
        pointer-events: none;
      }

      .toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        width: max-content;
        max-width: 100%;
        margin: 0;
        padding: 6px 8px;
        pointer-events: auto;
        background: rgba(35, 35, 35, .9);
        border: 2px solid #111;
        box-shadow: inset 2px 2px #666, inset -2px -2px #171717, 0 3px #0008;
        opacity: .84;
        transition: opacity 120ms linear;
      }

      .toolbar:hover, .toolbar:focus-within { opacity: 1; }

      .branding {
        min-width: 0;
        max-width: 210px;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .name {
        font-size: 13px;
        line-height: 1.2;
        color: #fff;
        text-shadow: 2px 2px #222;
      }

      .source {
        max-width: 210px;
        color: #cfcfcf;
        font-size: 9px;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }

      .controls {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 5px;
      }

      button, .open-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 29px;
        padding: 5px 9px;
        font-family: inherit;
        font-size: 10px;
        line-height: 1.2;
        color: white;
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;
        background: linear-gradient(#777, #555);
        border: 2px solid #171717;
        border-radius: 0;
        box-shadow: inset 2px 2px #b8b8b8, inset -2px -2px #333, 0 1px #090909;
        text-shadow: 1px 1px #222;
        image-rendering: pixelated;
      }

      button:hover, .open-link:hover, button:focus-visible, .open-link:focus-visible {
        background: linear-gradient(#8cbde0, #527fa0);
        outline: 1px solid white;
        outline-offset: 1px;
      }

      .open-link { background: linear-gradient(#739b55, #4c7435); }

      .status {
        width: fit-content;
        max-width: min(640px, calc(100vw - 24px));
        margin: 8px auto 0;
        padding: 7px 10px;
        color: #fff;
        background: rgba(0, 0, 0, .82);
        border: 2px solid #777;
        box-shadow: inset 1px 1px #aaa, inset -1px -1px #222;
        font-size: 10px;
        line-height: 1.5;
        text-align: center;
        pointer-events: auto;
      }

remove permanent bottom obstruction      @media (max-width: 680px) {
        .top-overlay { top: 5px; left: 5px; max-width: calc(100vw - 10px); }
        .toolbar { align-items: flex-start; gap: 6px; padding: 5px; }
        .branding { max-width: 130px; }
        .name { font-size: 11px; }
        .source { max-width: 130px; font-size: 8px; }
        .toolbar { width: calc(100vw - 10px); max-width: calc(100vw - 10px); flex-wrap: wrap; }
        .branding { flex: 1 1 95px; }
        .controls { flex: 1 1 100%; justify-content: flex-end; gap: 4px; }
        button, .open-link { min-height: 28px; padding: 4px 6px; font-size: 9px; white-space: normal; text-align: center; }
      }

      @media (max-width: 400px) {
        .toolbar { gap: 4px; }
        .source { max-width: 130px; overflow-wrap: anywhere; }
        .controls { max-width: 58%; }
        button, .open-link { padding: 4px; }
      }
    `
  }

  constructor () {
    super()
    this.version = '26.3'
    this.active = false
    this.frameSrc = ''
    this.status = ''
    this.showStatus = false
    this._loadTimer = null
    this._statusTimer = null
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    window.clearTimeout(this._loadTimer)
    window.clearTimeout(this._statusTimer)
  }

  showGame (version = '26.3') {
    const safeVersion = Object.prototype.hasOwnProperty.call(CLIENT_URLS, version) ? version : '26.3'
    const url = CLIENT_URLS[safeVersion]
    this.active = true
    this.style.display = 'block'
    window.dispatchEvent(new window.Event('mcweb-eagler-start'))

    if (this.version !== safeVersion || this.frameSrc !== url) {
      this.version = safeVersion
      this.frameSrc = url
      this.status = 'Loading the game from Eaglercraft…'
      this.showStatus = true
      window.clearTimeout(this._loadTimer)
      window.clearTimeout(this._statusTimer)
      this._loadTimer = window.setTimeout(() => {
        this.status = 'Still waiting for the game. If the screen remains blank, use Open separately.'
        this.showStatus = true
      }, 20000)
    }

    this.requestUpdate()
  }

  closeGame () {
    // Keep the iframe mounted so returning to the launcher does not force a
    // full game reload. The upstream game remains responsible for saving.
    this.active = false
    this.style.display = 'none'
    window.dispatchEvent(new window.Event('mcweb-eagler-stop'))
  }

  openStandalone () {
    const url = CLIENT_URLS[this.version] || CLIENT_URLS['26.3']
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  onFrameLoad () {
    if (!this.frameSrc) return
    window.clearTimeout(this._loadTimer)
    this.status = 'The Eaglercraft page responded. The game may take a moment to initialize.'
    this.showStatus = true
    window.clearTimeout(this._statusTimer)
    this._statusTimer = window.setTimeout(() => {
      this.showStatus = false
    }, 8500)
  }

  requestGameFullscreen () {
    const frame = this.renderRoot.querySelector('iframe')
    if (frame && frame.src !== 'about:blank' && frame.requestFullscreen) {
      frame.requestFullscreen().catch(() => this.openStandalone())
      return
    }
    this.openStandalone()
  }

  render () {
    const label = this.version === '1.8.8-wasm'
      ? 'EaglercraftX 1.8.8'
      : `Eaglercraft ${this.version}`
    const sourceNote = this.version === '1.8.8-wasm'
      ? 'Built-in PBR shaders: Options → Shaders · WebGL 2 required'
      : 'Resource packs supported · arbitrary shader-pack support not confirmed'
    const url = this.frameSrc || 'about:blank'

    return html`
      <main class="shell">
        <iframe
          class="game-frame"
          title=${label}
          src=${url}
          referrerpolicy="strict-origin-when-cross-origin"
          allow="autoplay; fullscreen; gamepad; keyboard-map; pointer-lock"
          allowfullscreen
          @load=${() => this.onFrameLoad()}
        ></iframe>

        <div class="top-overlay">
          <header class="toolbar">
            <div class="branding">
              <span class="name">${label}</span>
              <span class="source">${sourceNote}</span>
            </div>
            <div class="controls">
              <a class="open-link" href=${CLIENT_URLS[this.version] || CLIENT_URLS['26.3']} target="_blank" rel="noopener noreferrer">Open separately</a>
              <button @click=${() => this.requestGameFullscreen()}>Fullscreen</button>
              <button @click=${() => this.closeGame()}>Back</button>
            </div>
          </header>
          ${this.showStatus ? html`<div class="status" role="status">${this.status}</div>` : ''}
        </div>

      </main>
    `
  }
}

window.customElements.define('pmui-eaglerscreen', EaglerScreen)
