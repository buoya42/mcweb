#!/usr/bin/env node
const express = require('express')
const netApi = require('net-browserify')
const compression = require('compression')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const app = express()
const tokenFile = path.join(__dirname, '.mc-bridge-token')

if (!fs.existsSync(tokenFile)) {
  try {
    fs.writeFileSync(tokenFile, crypto.randomBytes(32).toString('hex') + '\n', {
      mode: 0o600,
      flag: 'wx'
    })
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
}

const bridgeToken = fs.readFileSync(tokenFile, 'utf8').trim()
if (bridgeToken.length < 32) {
  throw new Error('Invalid .mc-bridge-token file. Delete it and restart the server to generate a new token.')
}

app.get('/config.json', (_, res) => res.sendFile(path.join(__dirname, 'config.json')))

app.use(compression())

app.use('/api/vm/net', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-MC-Bridge-Token')

  if (req.method === 'OPTIONS') return res.sendStatus(204)

  if (req.method === 'POST' && req.path === '/connect') {
    const supplied = Buffer.from(req.get('x-mc-bridge-token') || '')
    const expected = Buffer.from(bridgeToken)

    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
      return res.status(401).json({ code: 401, error: 'Invalid bridge token' })
    }
  }
  next()
})

const allowedTargets = [
  { port: 25565 },
  { host: '127.0.0.1', port: 25568 },
  { host: 'localhost', port: 25568 }
]

const extraTargetsFile = path.join(__dirname, '.mc-allowed-targets')
if (fs.existsSync(extraTargetsFile)) {
  for (const line of fs.readFileSync(extraTargetsFile, 'utf8').split(/\r?\n/)) {
    const value = line.trim()
    if (!value || value.startsWith('#')) continue
    const colon = value.lastIndexOf(':')
    if (colon < 1) {
      console.warn('Ignoring invalid target in .mc-allowed-targets:', value)
      continue
    }
    const host = value.slice(0, colon).trim()
    const port = Number(value.slice(colon + 1))
    if (host && Number.isInteger(port) && port >= 1 && port <= 65535) {
      allowedTargets.push({ host, port })
    }
  }
}

app.use(netApi({ allowOrigin: '*', to: allowedTargets }))

if (process.argv[3] === 'dev') {
  const webpackDevMiddleware = require('webpack-dev-middleware')
  const config = require('./webpack.dev.js')
  const webpack = require('webpack')
  const compiler = webpack(config)
  app.use(webpackDevMiddleware(compiler, { publicPath: config.output.publicPath }))
} else {
  app.use(express.static(path.join(__dirname, './public')))
}

const port = Number(process.argv[2] || process.env.PORT || 8080)
const server = app.listen(port, '0.0.0.0', () => {
  console.log('MC Browser v0.2.0 listening on port ' + server.address().port)
  console.log('Protected bridge enabled. Token is stored in .mc-bridge-token.')
  console.log('Allowed targets: Minecraft port 25565 and local ViaProxy port 25568.')
})
