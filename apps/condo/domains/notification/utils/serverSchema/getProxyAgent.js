const { HttpsProxyAgent } = require('https-proxy-agent')
const { SocksProxyAgent } = require('socks-proxy-agent')

const conf = require('@open-condo/config')

const TELEGRAM_SOCKS_PROXY = conf.TELEGRAM_SOCKS_PROXY
const TELEGRAM_HTTP_PROXY = conf.TELEGRAM_HTTP_PROXY

let proxyAgent = null

const getProxyAgent = () => {
    if (proxyAgent) return proxyAgent

    if (TELEGRAM_HTTP_PROXY) {
        proxyAgent = new HttpsProxyAgent(TELEGRAM_HTTP_PROXY, {
            keepAlive: true,
            keepAliveMsecs: 10000,
            maxSockets: 256,
            maxFreeSockets: 256,
        })
    } else if (TELEGRAM_SOCKS_PROXY) {
        proxyAgent = new SocksProxyAgent(TELEGRAM_SOCKS_PROXY, {
            keepAlive: true,
            keepAliveMsecs: 10000,
            maxSockets: 256,
            maxFreeSockets: 256,
        })
    }

    return proxyAgent
}

module.exports = getProxyAgent