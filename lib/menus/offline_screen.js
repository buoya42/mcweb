const { LitElement, html, css } = require('lit')
const { displayScreen } = require('./components/common')
const THREE = require('three')

const DB = 'mcweb-worlds'
const STORE = 'worlds'
const RADIUS = 24
const MAX_Y = 24

function openDb () {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Browser storage is unavailable.'))
  })
}

async function allWorlds () {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result.sort((a, b) => b.updatedAt - a.updatedAt))
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

async function putWorld (world) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(world)
    tx.oncomplete = () => { db.close(); resolve(world) }
    tx.onerror = () => { db.close(); reject(tx.error || new Error('World could not be saved.')) }
  })
}

async function removeWorld (id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

function newId () {
  return crypto.randomUUID ? crypto.randomUUID() : 'world-' + Date.now() + Math.random().toString(36).slice(2)
}

function seedHash (text) {
  let h = 2166136261
  for (const char of String(text)) h = Math.imul(h ^ char.charCodeAt(0), 16777619)
  return h >>> 0
}

function noise (seed, x, z) {
  let n = (seed ^ Math.imul(x, 374761393) ^ Math.imul(z, 668265263)) >>> 0
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295
}

function pixelTexture (colour, seed) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 16
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = colour
  ctx.fillRect(0, 0, 16, 16)
  for (let i = 0; i < 65; i++) {
    const n = noise(seed, i, seed + i)
    ctx.fillStyle = n > 0.5 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.13)'
    ctx.fillRect(Math.floor(n * 16), Math.floor(noise(seed + 3, i, seed) * 16), 1 + (i % 5 === 0 ? 1 : 0), 1)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

class OfflineVoxelGame {
  constructor (renderer, world, changed, pauseChanged) {
    this.renderer = renderer
    this.world = world
    this.changed = changed
    this.pauseChanged = pauseChanged
    this.seed = seedHash(world.seed)
    this.changes = world.changes || {}
    this.heights = new Map()
    this.keys = new Set()
    this.running = true
    this.paused = false
    this.selectedBlock = 1
    this.frame = null
    this.lastSave = 0
    this.mouseLocked = false
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87c9f9)
    this.scene.fog = new THREE.Fog(0x87c9f9, 34, 72)
    this.camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 100)
    this.camera.rotation.order = 'YXZ'
    this.oldClear = renderer.getClearColor(new THREE.Color()).clone()
    this.oldAlpha = renderer.getClearAlpha()
    renderer.setClearColor(0x87c9f9, 1)
    renderer.setSize(innerWidth, innerHeight)
    this.scene.add(new THREE.HemisphereLight(0xd9efff, 0x66533a, 2.1))
    const sun = new THREE.DirectionalLight(0xfff2d2, 2)
    sun.position.set(-25, 45, -18)
    this.scene.add(sun)
    this.geometry = new THREE.BoxGeometry(1, 1, 1)
    const dirt = new THREE.MeshLambertMaterial({ map: pixelTexture('#88603d', this.seed + 2) })
    const grass = new THREE.MeshLambertMaterial({ map: pixelTexture('#70b84d', this.seed + 1) })
    const stone = new THREE.MeshLambertMaterial({ map: pixelTexture('#858585', this.seed + 3) })
    this.materials = { 1: [dirt, dirt, grass, dirt, dirt, dirt], 2: [dirt, dirt, dirt, dirt, dirt, dirt], 3: [stone, stone, stone, stone, stone, stone] }
    this.meshes = []
    this.rebuild()
    const p = world.player || {}
    const x = Number.isFinite(p.x) ? p.x : 0
    const z = Number.isFinite(p.z) ? p.z : 0
    this.camera.position.set(x, Number.isFinite(p.y) ? p.y : this.heightAt(Math.floor(x), Math.floor(z)) + 3, z)
    this.camera.rotation.y = Number.isFinite(p.yaw) ? p.yaw : 0
    this.camera.rotation.x = Number.isFinite(p.pitch) ? p.pitch : 0
    this.raycaster = new THREE.Raycaster()
    this.raycaster.far = 6
    this.onClick = this.onClick.bind(this)
    this.onContext = event => event.preventDefault()
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = event => this.keys.delete(event.code)
    this.onLock = this.onLock.bind(this)
    this.onResize = this.onResize.bind(this)
    this.onVisibility = this.onVisibility.bind(this)
    renderer.domElement.addEventListener('click', this.onClick)
    renderer.domElement.addEventListener('contextmenu', this.onContext)
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('pointerlockchange', this.onLock)
    window.addEventListener('resize', this.onResize)
    document.addEventListener('visibilitychange', this.onVisibility)
    this.lastTime = performance.now()
    this.tick()
  }

  heightAt (x, z) {
    const key = x + ',' + z
    if (!this.heights.has(key)) {
      const hills = Math.sin((x + this.seed % 29) * 0.19) * 1.3 + Math.cos((z - this.seed % 19) * 0.17) * 1.1 + (noise(this.seed, x, z) - 0.5) * 1.6
      this.heights.set(key, Math.max(3, Math.min(9, Math.floor(5 + hills))))
    }
    return this.heights.get(key)
  }

  key (x, y, z) { return x + ',' + y + ',' + z }

  baseBlock (x, y, z) {
    if (x < -RADIUS || x >= RADIUS || z < -RADIUS || z >= RADIUS || y < 0 || y > MAX_Y) return 0
    const h = this.heightAt(x, z)
    if (y > h) return 0
    if (y === h) return 1
    return y >= h - 3 ? 2 : 3
  }

  getBlock (x, y, z) {
    const key = this.key(x, y, z)
    return Object.prototype.hasOwnProperty.call(this.changes, key) ? this.changes[key] : this.baseBlock(x, y, z)
  }

  rebuild () {
    for (const mesh of this.meshes) this.scene.remove(mesh)
    this.meshes = []
    const blocks = { 1: [], 2: [], 3: [] }
    for (let x = -RADIUS; x < RADIUS; x++) {
      for (let z = -RADIUS; z < RADIUS; z++) {
        this.heightAt(x, z)
        for (let y = 0; y <= MAX_Y; y++) {
          const type = this.getBlock(x, y, z)
          if (type) blocks[type].push([x, y, z])
        }
      }
    }
    for (const type of [1, 2, 3]) {
      if (!blocks[type].length) continue
      const mesh = new THREE.InstancedMesh(this.geometry, this.materials[type], blocks[type].length)
      const matrix = new THREE.Matrix4()
      blocks[type].forEach(([x, y, z], i) => {
        matrix.makeTranslation(x + 0.5, y + 0.5, z + 0.5)
        mesh.setMatrixAt(i, matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
      mesh.frustumCulled = false
      mesh.userData.blockType = type
      this.scene.add(mesh)
      this.meshes.push(mesh)
    }
  }

  savePlayer () {
    this.world.player = { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z, yaw: this.camera.rotation.y, pitch: this.camera.rotation.x }
    this.world.changes = this.changes
    this.world.updatedAt = Date.now()
    if (this.changed) this.changed(this.world)
  }

  tick () {
    if (!this.running) return
    this.frame = requestAnimationFrame(() => this.tick())
    const now = performance.now()
    const delta = Math.min((now - this.lastTime) / 1000, 0.05)
    this.lastTime = now
    if (!this.paused) this.move(delta)
    this.renderer.render(this.scene, this.camera)
    if (now - this.lastSave > 10000) { this.lastSave = now; this.savePlayer() }
  }

  move (delta) {
    const direction = new THREE.Vector3()
    this.camera.getWorldDirection(direction)
    const forward = new THREE.Vector3(direction.x, 0, direction.z)
    if (forward.lengthSq()) forward.normalize()
    const right = new THREE.Vector3(-forward.z, 0, forward.x)
    const speed = this.keys.has('ShiftLeft') ? 11 : 7
    if (this.keys.has('KeyW')) this.camera.position.addScaledVector(forward, speed * delta)
    if (this.keys.has('KeyS')) this.camera.position.addScaledVector(forward, -speed * delta)
    if (this.keys.has('KeyD')) this.camera.position.addScaledVector(right, speed * delta)
    if (this.keys.has('KeyA')) this.camera.position.addScaledVector(right, -speed * delta)
    if (this.keys.has('Space')) this.camera.position.y += speed * delta
    if (this.keys.has('ControlLeft') || this.keys.has('ControlRight')) this.camera.position.y -= speed * delta
    this.camera.position.x = Math.max(-RADIUS + 0.1, Math.min(RADIUS - 0.1, this.camera.position.x))
    this.camera.position.z = Math.max(-RADIUS + 0.1, Math.min(RADIUS - 0.1, this.camera.position.z))
    this.camera.position.y = Math.max(1, Math.min(MAX_Y + 15, this.camera.position.y))
  }

  onClick (event) {
    if (!this.running) return
    if (this.paused) {
      if (event.button === 0) this.renderer.domElement.requestPointerLock()
      return
    }
    if (document.pointerLockElement !== this.renderer.domElement) {
      this.renderer.domElement.requestPointerLock()
      return
    }
    if (event.button !== 0 && event.button !== 2) return
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera)
    const hits = this.raycaster.intersectObjects(this.meshes, false)
    if (!hits.length) return
    const hit = hits[0]
    const n = hit.face.normal
    const p = hit.point
    const sign = event.button === 0 ? -0.01 : 0.01
    const x = Math.floor(p.x + n.x * sign)
    const y = Math.floor(p.y + n.y * sign)
    const z = Math.floor(p.z + n.z * sign)
    if (x < -RADIUS || x >= RADIUS || z < -RADIUS || z >= RADIUS || y < 0 || y > MAX_Y) return
    const type = event.button === 0 ? 0 : this.selectedBlock
    if (type && this.getBlock(x, y, z)) return
    this.changes[this.key(x, y, z)] = type
    this.rebuild()
    this.savePlayer()
    if (this.changed) this.changed(this.world)
  }

  onMouseMove (event) {
    if (this.paused || document.pointerLockElement !== this.renderer.domElement) return
    this.camera.rotation.y -= event.movementX * 0.0022
    this.camera.rotation.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.camera.rotation.x - event.movementY * 0.0022))
  }

  onKeyDown (event) {
    if (event.code === 'Escape' && this.running) {
      event.preventDefault()
      this.paused = true
      if (document.exitPointerLock) document.exitPointerLock()
      if (this.pauseChanged) this.pauseChanged(true)
      return
    }
    if (this.paused) return
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight'].includes(event.code)) event.preventDefault()
    this.keys.add(event.code)
    const block = { Digit1: 1, Digit2: 2, Digit3: 3 }[event.code]
    if (block) {
      this.selectedBlock = block
      if (this.pauseChanged) this.pauseChanged(false, block)
    }
  }

  onLock () {
    if (!this.running) return
    if (document.pointerLockElement === this.renderer.domElement) {
      this.paused = false
      this.mouseLocked = true
      if (this.pauseChanged) this.pauseChanged(false, this.selectedBlock)
    } else if (this.mouseLocked) {
      this.paused = true
      this.keys.clear()
      if (this.pauseChanged) this.pauseChanged(true, this.selectedBlock)
    }
  }

  onResize () {
    this.camera.aspect = innerWidth / innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(innerWidth, innerHeight)
  }

  onVisibility () {
    if (document.visibilityState === 'hidden') this.savePlayer()
  }

  stop () {
    this.savePlayer()
    this.running = false
    if (this.frame) cancelAnimationFrame(this.frame)
    if (document.exitPointerLock) document.exitPointerLock()
    this.renderer.domElement.removeEventListener('click', this.onClick)
    this.renderer.domElement.removeEventListener('contextmenu', this.onContext)
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('pointerlockchange', this.onLock)
    window.removeEventListener('resize', this.onResize)
    document.removeEventListener('visibilitychange', this.onVisibility)
    for (const mesh of this.meshes) this.scene.remove(mesh)
    this.geometry.dispose()
    for (const materials of Object.values(this.materials)) materials.forEach(material => {
      if (material.map) material.map.dispose()
      material.dispose()
    })
    this.renderer.setClearColor(this.oldClear, this.oldAlpha)
  }
}

class OfflineScreen extends LitElement {
  static get properties () {
    return { view: { state: true }, worlds: { state: true }, selectedId: { state: true }, worldName: { state: true }, seed: { state: true }, status: { state: true }, playing: { state: true }, paused: { state: true }, selectedBlock: { state: true } }
  }

  static get styles () {
    return css`
      :host { position: fixed; inset: 0; z-index: 30; display: block; color: white; font-family: Minecraft, mojangles, monospace; pointer-events: none; }
      * { box-sizing: border-box; }
      .menu-bg { position: absolute; inset: 0; display: grid; place-items: center; padding: 16px; background: linear-gradient(#0009,#000c), repeating-linear-gradient(0deg,#5a5a5a 0 3px,#505050 3px 6px); pointer-events: auto; }
      .panel { width: min(760px,calc(100vw - 28px)); max-height: calc(100vh - 28px); overflow: auto; padding: 12px; border: 2px solid #171717; outline: 1px solid #bbb; background: #c6c6c6; color: #222; box-shadow: 0 8px #0006; }
      .title { margin: 2px 0 12px; text-align: center; color: white; font-size: 23px; text-shadow: 2px 2px #555; }
      .subtitle { text-align: center; margin: -4px 0 12px; color: #eaeaea; font-size: 12px; }
      .world-list { display: grid; gap: 7px; max-height: 46vh; overflow: auto; padding: 2px; margin-bottom: 12px; }
      .world-row { display: grid; grid-template-columns: 52px minmax(0,1fr); align-items: center; gap: 10px; padding: 8px; background: #888; border: 2px solid #333; box-shadow: inset 2px 2px #ddd,inset -2px -2px #555; cursor: pointer; }
      .world-row.selected { background: #6889a1; border-color: white; }
      .world-icon { width: 48px; height: 48px; border: 2px solid #333; background: linear-gradient(#70b84d 0 30%,#88603d 30%); }
      .world-name { color: white; font-size: 15px; text-shadow: 1px 1px #333; overflow-wrap: anywhere; }
      .world-meta { color: #f3f3f3; font-size: 11px; margin-top: 5px; line-height: 1.5; overflow-wrap: anywhere; }
      .empty { min-height: 108px; display: grid; place-items: center; text-align: center; padding: 18px; line-height: 1.7; color: white; background: #888; border: 2px inset #eee; font-size: 13px; }
      .actions { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; }
      button,input,select { font: inherit; font-size: 13px; border-radius: 0; }
      button { min-height: 36px; padding: 7px 12px; color: white; background: linear-gradient(#777,#555); border: 2px solid #222; box-shadow: inset 2px 2px #bbb,inset -2px -2px #3d3d3d,0 2px #333; text-shadow: 1px 1px #222; cursor: pointer; }
      button:hover:not(:disabled),button:focus-visible { background: linear-gradient(#8cbde0,#527fa0); outline: 2px solid white; outline-offset: 1px; }
      button:disabled { opacity: .45; cursor: not-allowed; }
      button.primary { background: linear-gradient(#739b55,#4c7435); }
      button.danger { background: linear-gradient(#a95b52,#7b302a); }
      input,select { width: 100%; padding: 9px; color: #222; background: white; border: 2px solid #555; box-shadow: inset 2px 2px #bbb; }
      .field { display: grid; gap: 6px; margin: 12px 0; font-size: 13px; }
      .field small { font-size: 11px; color: #444; line-height: 1.5; }
      .status { margin-top: 10px; text-align: center; color: #742d27; font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
      .footnote { margin: 12px 0 0; font-size: 11px; text-align: center; line-height: 1.5; color: #333; }
      .game-hud { position: absolute; inset: 0; color: white; text-shadow: 1px 2px #333; pointer-events: none; }
      .top-left { position: absolute; top: 14px; left: 14px; font-size: 13px; line-height: 1.6; }
      .game-hint { position:absolute; bottom:76px; left:50%; transform:translateX(-50%); max-width:calc(100vw - 24px); padding:6px 9px; background:#0008; text-align:center; font-size:11px; line-height:1.45; }
      .crosshair { position: absolute; top: 50%; left: 50%; width: 18px; height: 18px; transform: translate(-50%,-50%); }
      .crosshair:before,.crosshair:after { content: ""; position: absolute; background: white; box-shadow: 1px 1px #333; }
      .crosshair:before { width: 2px; height: 18px; left: 8px; }
      .crosshair:after { width: 18px; height: 2px; top: 8px; }
      .hotbar { position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%); display: flex; gap: 3px; padding: 4px; background: #222b; border: 2px solid #fffa; pointer-events: auto; }
      .slot { width: 43px; height: 43px; padding: 2px; min-height: 0; display: grid; place-items: center; position: relative; background: #444c; border: 2px solid #aaa; box-shadow: none; }
      .slot.active { border: 3px solid white; background: #888d; }
      .swatch { width: 23px; height: 23px; border: 2px solid #0008; box-shadow: inset 2px 2px #ffffff33,inset -2px -2px #0003; }
      .grass { background: linear-gradient(#70b84d 0 34%,#88603d 34%); } .dirt { background: #88603d; } .stone { background: #858585; }
      .key-number { position: absolute; top: 1px; left: 3px; font-size: 9px; }
      .paused { position: absolute; inset: 0; display: grid; place-items: center; padding: 16px; background: #0008; pointer-events: auto; }
      .pause-panel { width: min(420px,calc(100vw - 32px)); padding: 18px; text-align: center; background: #c6c6c6; color: #222; border: 2px solid #222; outline: 1px solid #ddd; }
      .pause-panel h2 { font-size: 22px; margin-bottom: 12px; } .pause-panel p { font-size: 12px; line-height: 1.6; margin: 10px 0; }
      @media(max-width:520px) { .menu-bg{padding:8px}.panel{width:calc(100vw - 16px);padding:9px}.title{font-size:19px}.world-row{grid-template-columns:42px minmax(0,1fr);gap:7px;padding:6px}.world-icon{width:38px;height:38px}.world-name{font-size:12px}.world-meta{font-size:10px}.slot{width:35px;height:38px}.swatch{width:19px;height:19px}.hotbar{bottom:10px;gap:2px;padding:3px} }
    `
  }

  constructor () {
    super()
    this.view = 'list'
    this.worlds = []
    this.selectedId = ''
    this.worldName = 'My World'
    this.seed = String(Math.floor(Math.random() * 2147483647))
    this.status = ''
    this.playing = false
    this.paused = false
    this.selectedBlock = 1
    this.currentWorld = null
    this.game = null
  }

  firstUpdated () { this.refresh() }

  async refresh () {
    try {
      this.worlds = await allWorlds()
      if (!this.worlds.some(world => world.id === this.selectedId)) this.selectedId = this.worlds.length ? this.worlds[0].id : ''
      this.status = ''
    } catch (error) { this.status = error.message || String(error) }
  }

  async createWorld () {
    const name = this.worldName.trim()
    if (!name) { this.status = 'Give your world a name first.'; return }
    const world = { id: newId(), name: name.slice(0, 40), seed: String(this.seed || '0').slice(0, 80), gameMode: 'creative', createdAt: Date.now(), updatedAt: Date.now(), changes: {}, player: null }
    try {
      await putWorld(world)
      await this.refresh()
      this.selectedId = world.id
      await this.startWorld(world.id)
    } catch (error) { this.status = error.message || String(error) }
  }

  async startSelected () {
    if (this.selectedId) await this.startWorld(this.selectedId)
  }

  async startWorld (id) {
    try {
      const world = (await allWorlds()).find(item => item.id === id)
      if (!world) throw new Error('This world was not found in browser storage.')
      if (!window.mcBrowserRenderer) throw new Error('3D renderer is not ready. Reload the page and try again.')
      this.currentWorld = world
      this.selectedId = id
      this.playing = true
      this.paused = false
      this.selectedBlock = 1
      this.view = 'game'
      const root = document.getElementById('ui-root')
      if (root) root.style.display = 'none'
      window.dispatchEvent(new Event('mcweb-offline-start'))
      await this.updateComplete
      this.game = new OfflineVoxelGame(window.mcBrowserRenderer, world, changed => this.save(changed), (paused, block) => {
        this.paused = paused
        if (block) this.selectedBlock = block
      })
    } catch (error) {
      this.playing = false
      this.view = 'list'
      this.status = error.message || String(error)
      const root = document.getElementById('ui-root')
      if (root) root.style.display = ''
      window.dispatchEvent(new Event('mcweb-offline-stop'))
    }
  }

  async save (world) {
    try { await putWorld(world); this.currentWorld = world } catch (error) { this.status = 'World save failed: ' + error.message }
  }

  async deleteSelected () {
    const world = this.worlds.find(item => item.id === this.selectedId)
    if (!world) return
    if (!confirm('Delete "' + world.name + '" from this browser? Export a backup first if you want to keep it.')) return
    try { await removeWorld(world.id); this.selectedId = ''; await this.refresh() } catch (error) { this.status = error.message }
  }

  async exportSelected () {
    const world = this.worlds.find(item => item.id === this.selectedId)
    if (!world) return
    const blob = new Blob([JSON.stringify({ format: 'mcweb-world-v1', world }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = world.name.replace(/[^a-z0-9-_]+/gi, '_') + '.mcweb-world.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  async importBackup (event) {
    const file = event.target.files && event.target.files[0]
    event.target.value = ''
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      const source = data && data.format === 'mcweb-world-v1' ? data.world : data
      if (!source || typeof source.name !== 'string' || typeof source.seed !== 'string' || !source.changes || typeof source.changes !== 'object') throw new Error('That file is not a valid world backup.')
      const cleanChanges = {}
      for (const [key, value] of Object.entries(source.changes)) {
        if (Object.keys(cleanChanges).length >= 50000) break
        const coords = key.split(',').map(Number)
        if (coords.length !== 3 || !coords.every(Number.isInteger)) continue
        const [x, y, z] = coords
        if (x < -RADIUS || x >= RADIUS || z < -RADIUS || z >= RADIUS || y < 0 || y > MAX_Y) continue
        if (!Number.isInteger(value) || value < 0 || value > 3) continue
        cleanChanges[key] = value
      }
      const playerSource = source.player && typeof source.player === 'object' ? source.player : null
      const player = playerSource ? {
        x: Number.isFinite(playerSource.x) ? Math.max(-RADIUS + 1, Math.min(RADIUS - 1, playerSource.x)) : 0,
        y: Number.isFinite(playerSource.y) ? Math.max(1, Math.min(MAX_Y + 15, playerSource.y)) : 9,
        z: Number.isFinite(playerSource.z) ? Math.max(-RADIUS + 1, Math.min(RADIUS - 1, playerSource.z)) : 0,
        yaw: Number.isFinite(playerSource.yaw) ? playerSource.yaw : 0,
        pitch: Number.isFinite(playerSource.pitch) ? Math.max(-1.56, Math.min(1.56, playerSource.pitch)) : 0
      } : null
      const world = { id: newId(), name: source.name.slice(0, 40), seed: source.seed.slice(0, 80), gameMode: 'creative', createdAt: Date.now(), updatedAt: Date.now(), changes: cleanChanges, player }
      await putWorld(world)
      await this.refresh()
      this.selectedId = world.id
      this.status = 'Backup imported. Select the world and press Play Selected World.'
    } catch (error) { this.status = error.message || String(error) }
  }

  selectBlock (block) {
    this.selectedBlock = block
    if (this.game) this.game.selectedBlock = block
  }

  resume () {
    if (this.game) {
      this.game.paused = false
      this.game.mouseLocked = false
      this.paused = false
      this.game.renderer.domElement.requestPointerLock()
    }
  }

  async leaveWorld () {
    if (this.game) { this.game.stop(); this.game = null }
    if (this.currentWorld) await this.save(this.currentWorld)
    this.playing = false
    this.paused = false
    this.view = 'list'
    const root = document.getElementById('ui-root')
    if (root) root.style.display = ''
    window.dispatchEvent(new Event('mcweb-offline-stop'))
    this.style.display = 'none'
    displayScreen(this, document.getElementById('title-screen'))
    await this.refresh()
  }

  render () {
    const selected = this.worlds.find(world => world.id === this.selectedId)
    return html`
      ${!this.playing ? html`
        <div class="menu-bg">
          <main class="panel">
            ${this.view === 'create' ? html`
              <h1 class="title">Create New World</h1>
              <label class="field">World Name
                <input autofocus maxlength="40" .value=${this.worldName} @input=${event => { this.worldName = event.target.value }} @keydown=${event => { if (event.key === 'Enter') this.createWorld() }} />
              </label>
              <label class="field">Seed
                <input maxlength="80" .value=${this.seed} @input=${event => { this.seed = event.target.value }} @keydown=${event => { if (event.key === 'Enter') this.createWorld() }} />
                <small>Same seed = same terrain.</small>
              </label>
              <label class="field">Game Mode
                <select disabled><option>Creative (available)</option></select>
                <small>Survival, mobs, crafting and the official Minecraft Java engine are not included in this offline prototype.</small>
              </label>
              <div class="actions">
                <button class="primary" @click=${() => this.createWorld()}>Create New World</button>
                <button @click=${() => { this.view = 'list'; this.status = '' }}>Cancel</button>
              </div>
            ` : html`
              <h1 class="title">Select World</h1>
              <p class="subtitle">MC Browser · Offline Creative</p>
              ${this.worlds.length ? html`
                <div class="world-list">
                  ${this.worlds.map(world => html`
                    <div class="world-row ${this.selectedId === world.id ? 'selected' : ''}" role="button" tabindex="0" @click=${() => { this.selectedId = world.id; this.status = '' }} @keydown=${event => { if (event.key === 'Enter' || event.key === ' ') this.selectedId = world.id }}>
                      <div class="world-icon"></div>
                      <div><div class="world-name">${world.name}</div><div class="world-meta">Creative Mode · Seed: ${world.seed}<br />Last played: ${new Date(world.updatedAt || world.createdAt).toLocaleString()}</div></div>
                    </div>
                  `)}
                </div>
              ` : html`
                <div class="empty">No saved worlds yet.<br />Choose Create New World to generate your first world.<br />World data stays in this browser.</div>
              `}
              <div class="actions">
                <button class="primary" ?disabled=${!selected} @click=${() => this.startSelected()}>Play Selected World</button>
                <button @click=${() => { this.worldName = 'My World'; this.seed = String(Math.floor(Math.random() * 2147483647)); this.view = 'create'; this.status = '' }}>Create New World</button>
                <button ?disabled=${!selected} @click=${() => this.exportSelected()}>Export Backup</button>
                <button class="danger" ?disabled=${!selected} @click=${() => this.deleteSelected()}>Delete</button>
                <button @click=${() => this.refresh()}>Refresh</button>
                <button @click=${() => displayScreen(this, document.getElementById('play-screen'))}>Back</button>
              </div>
              <label class="field">Import a world backup
                <input type="file" accept=".json,application/json" @change=${event => this.importBackup(event)} />
              </label>
            `}
            ${this.status ? html`<div class="status" role="status">${this.status}</div>` : ''}
            <p class="footnote">Worlds are stored locally with IndexedDB. Clearing browser data may delete them; export a backup to keep a copy.</p>
          </main>
        </div>
      ` : html`
        <div class="game-hud">
          <div class="top-left">${this.currentWorld ? this.currentWorld.name : 'Offline World'}<br />Creative · Offline · Local save</div>
          <div class="crosshair"></div>
          <div class="game-hint">Click to capture mouse · WASD move · Space fly up · Ctrl fly down · Left/right click break/place · Esc menu</div>
          <div class="hotbar">
            <button class="slot ${this.selectedBlock === 1 ? 'active' : ''}" @click=${() => this.selectBlock(1)}><span class="key-number">1</span><span class="swatch grass"></span></button>
            <button class="slot ${this.selectedBlock === 2 ? 'active' : ''}" @click=${() => this.selectBlock(2)}><span class="key-number">2</span><span class="swatch dirt"></span></button>
            <button class="slot ${this.selectedBlock === 3 ? 'active' : ''}" @click=${() => this.selectBlock(3)}><span class="key-number">3</span><span class="swatch stone"></span></button>
          </div>
          ${this.paused ? html`
            <div class="paused"><div class="pause-panel">
              <h2>Game Menu</h2><p>Your changes are saved locally. Resume building or save and return to the title screen.</p>
              <p>WASD move · Space fly up · Ctrl fly down · Left click break · Right click place · 1–3 select block · Esc pause</p>
              <div class="actions"><button class="primary" @click=${() => this.resume()}>Resume Game</button><button @click=${() => this.leaveWorld()}>Save and Quit to Title</button></div>
            </div></div>
          ` : ''}
        </div>
      `}
    `
  }
}

window.customElements.define('pmui-offlinescreen', OfflineScreen)
