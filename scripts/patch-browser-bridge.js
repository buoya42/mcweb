'use strict'

const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', 'node_modules', 'net-browserify', 'browser.js')
let source = fs.readFileSync(file, 'utf8')

// Replace the complete proxy section using explicit boundaries.
// Avoid matching a generic "};", which can corrupt unrelated functions.
const start = source.indexOf('var defaultProxy = {')
const end = source.indexOf('exports.createServer = function ()', start)

if (start === -1 || end === -1) {
  throw new Error('Could not locate the proxy section safely; file was not changed.')
}

const proxySection = `var defaultProxy = {
    protocol: (window.location.protocol === 'https:') ? 'wss' : 'ws',
    requestProtocol: '',
    hostname: window.location.hostname,
    port: window.location.port,
    path: '/api/vm/net',
    token: ''
};

var proxy = Object.assign({}, defaultProxy);

function getProxy() {
    return proxy;
}

function getProxyHost() {
    var host = getProxy().hostname;
    if (getProxy().port) {
        host += ':' + getProxy().port;
    }
    return host;
}

function getProxyOrigin() {
    if (getProxy().requestProtocol) {
        proxy.protocol = getProxy().requestProtocol === 'https:' ? 'wss' : 'ws';
    }
    return getProxy().protocol + '://' + getProxyHost();
}

exports.setProxy = function (options) {
    options = options || {};
    proxy = Object.assign({}, defaultProxy);

    if (options.protocol) {
        proxy.protocol = options.protocol;
    }

    if (Object.prototype.hasOwnProperty.call(options, 'token')) {
        proxy.token = options.token || '';
    }

    var hostname = options.hostname;
    if (hostname) {
        var requestProtocol = '';

        if (hostname.indexOf('http://') === 0) {
            requestProtocol = 'http:';
            hostname = hostname.slice(7);
        } else if (hostname.indexOf('https://') === 0) {
            requestProtocol = 'https:';
            hostname = hostname.slice(8);
        }

        proxy.requestProtocol = requestProtocol;
        proxy.hostname = hostname;
    }

    if (Object.prototype.hasOwnProperty.call(options, 'port')) {
        proxy.port = options.port;
    }

    if (options.path) {
        proxy.path = options.path;
    }
};

`

source = source.slice(0, start) + proxySection + source.slice(end)

// Use the HTTPS browser transport when the page itself is HTTPS.
source = source.replace(
    /var http = require\(['"]http['"]\);/,
    "var http = (window.location.protocol === 'https:') ? require('https') : require('http');"
)

// Remove duplicate bridge-token headers before adding exactly one.
source = source.replace(
    /^[ \t]*if \(getProxy\(\)\.token\) req\.setHeader\('X-MC-Bridge-Token', getProxy\(\)\.token\);[ \t]*\r?\n/gm,
    ''
)

const headerPattern =
    /^([ \t]*)req\.setHeader\(['"]Content-Type['"],[ \t]*['"]application\/json['"]\);[ \t]*$/m

const headerMatch = source.match(headerPattern)

if (!headerMatch) {
    throw new Error('Could not find the connection request headers; file was not written.')
}

source = source.replace(
    headerPattern,
    (_, indent) =>
        `${indent}req.setHeader('Content-Type', 'application/json');\n` +
        `${indent}if (getProxy().token) req.setHeader('X-MC-Bridge-Token', getProxy().token);`
)

fs.writeFileSync(file, source)
console.log('Browser bridge patch applied successfully.')
