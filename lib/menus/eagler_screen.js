const { LitElement, html, css } = require('lit')

const CLIENT_URLS = {
  '26.2': 'https://dev.eaglercraft.com/play?version=26.2',
  '1.8.8-wasm': 'https://dev.eaglercraft.com/play?version=1.8.8-wasm'
}

class EaglerScreen extends LitElement {
  static get properties () {
    return {
      version: { type: String },
      active: { type: Boolean }
    }
  }

  static get styles () {
    return css`
      :host {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: none;
        font-family: Minecraft, mojangles, monospace;
        color: #fff;
      }

      * { box-sizing: border-box; }

      .shell {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-height: 0;
        background: #101010;
      }

      .toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 46px;
        padding: 6px 10px;
        background: #292929;
        border-bottom: 2px solid #050505;
        box-shadow: inset 0 1px #555;
      }

      .branding {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .name {
        font-size: 14px;
        color: #fff;
        text-shadow: 1px 1px #222;
      }

      .source {
        color: #c8c8c8;
        font-size: 10px;
      }

      .spacer { flex: 1; }

      .controls {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 6px;
      }

      button, .open-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 31px;
        padding: 5px 10px;
        font-family: inherit;
        font-size: 11px;
        color: white;
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;
        background: linear-gradient(#777, #555);
        border: 2px solid #111;
        box-shadow: inset 1px 1px #bbb, inset -1px -1px #333;
        text-shadow: 1px 1px #222;
      }

      button:hover, .open-link:hover, button:focus-visible, .open-link:focus-visible {
        background: linear-gradient(#8cbde0, #527fa0);
        outline: 1px solid white;
        outline-offset: 1px;
      }

      .open-link { background: linear-gradient(#739b55, #4c7435); }

      iframe {
        display: block;
        flex: 1;
        width: 100%;
        min-height: 0;
        border: 0;
        background: #000;
      }

      .fallback {
        flex: 1;
        display: grid;
        place-content: center;
        gap: 12px;
        padding: 24px;
        text-align: center;
        color: #eee;
        background: #252525;
        font-family: sans-serif;
      }

      .fallback h2 { margin: 0; font-size: 20px; }
      .fallback p { max-width: 580px; margin: 0 auto; font-size: 14px; line-height: 1.6; }
      .fallback .open-link { justify-self: center; min-height: 40px; font-size: 13px; }

      @media (max-width: 560px) {
        .toolbar { gap: 7px; padding: 5px; }
        .name { font-size: 12px; }
        .source { font-size: 9px; }
        .controls { gap: 4px; }
        button, .open-link { min-height: 29px; padding: 4px 6px; font-size: 10px; }
      }
    `
  }

  constructor () {
    super()
    this.version = '26.2'
    this.active = false
  }

  showGame (version = '26.2') {
    this.version = Object.prototype.hasOwnProperty.call(CLIENT_URLS, version) ? version : '26.2'
    this.active = true
    this.style.display = 'block'
    this.requestUpdate()
  }

  closeGame () {
    this.active = false
    this.style.display = 'none'
    this.requestUpdate()
  }

  openStandalone () {
    const url = CLIENT_URLS[this.version] || CLIENT_URLS['26.2']
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  requestGameFullscreen () {
    const frame = this.renderRoot.querySelector('iframe')
    if (!frame) {
      this.openStandalone()
      return
    }
    if (frame.requestFullscreen) {
      frame.requestFullscreen().catch(() => this.openStandalone())
    } else {
      this.openStandalone()
    }
  }

  render () {
    const url = CLIENT_URLS[this.version] || CLIENT_URLS['26.2']
    const label = this.version === '1.8.8-wasm' ? 'EaglercraftX 1.8.8' : 'Eaglercraft 26.2'
    return html`
      <main class="shell">
        <header class="toolbar">
          <div class="branding">
            <span class="name">${label}</span>
            <span class="source">Loaded from dev.eaglercraft.com · community project</span>
          </div>
          <div class="spacer"></div>
          <div class="controls">
            <a class="open-link" href=${url} target="_blank" rel="noopener noreferrer">Open separately</a>
            <button @click=${() => this.requestGameFullscreen()}>Fullscreen</button>
            <button @click=${() => this.closeGame()}>Back</button>
          </div>
        </header>
        ${this.active ? html`
          <iframe
            title=${label}
            src=${url}
            referrerpolicy="no-referrer"
            allow="autoplay; fullscreen; gamepad; keyboard-map; pointer-lock"
            allowfullscreen
          ></iframe>
          <noscript>JavaScript is required to play.</noscript>
        ` : html`
          <section class="fallback">
            <h2>Ready to play</h2>
            <p>The game is loaded from the upstream Eaglercraft website, not copied into this repository. If its site policy blocks embedding, choose Open separately to play there directly.</p>
            <a class="open-link" href=${url} target="_blank" rel="noopener noreferrer">Launch ${label}</a>
          </section>
        `}
      </main>
    `
  }
}

window.customElements.define('pmui-eaglerscreen', EaglerScreen)
