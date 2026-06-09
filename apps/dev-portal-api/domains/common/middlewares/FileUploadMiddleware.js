const { Readable } = require('stream')

const express = require('express')

const conf = require('@open-condo/config')
const { createProxy } = require('@open-condo/miniapp-utils/helpers/proxying')

const { OIDCMiddleware } = require('./OIDCMiddleware')

function reStreamParsedBody (req, res, next) {
    if (req.body === undefined) return next()

    const bodyStr = JSON.stringify(req.body)
    const bodyBuffer = Buffer.from(bodyStr)

    req.headers['content-type'] = 'application/json'
    req.headers['content-length'] = String(bodyBuffer.length)

    const bodyStream = Readable.from(bodyBuffer)
    req.pipe = bodyStream.pipe.bind(bodyStream)

    next()
}

class FileUploadMiddleware {
    constructor () {
        // TODO: make sure it exists on prod / dev / prepare
        const ipProxyConfig = conf['CONDO_PROXY_CONFIG'] ? JSON.parse(conf['CONDO_PROXY_CONFIG']) : null
        const trustedProxies = conf['TRUSTED_PROXIES_CONFIG'] ? JSON.parse(conf['TRUSTED_PROXIES_CONFIG']) : undefined

        this._proxyHandler = createProxy({
            name: 'DevPortalFilesMiddleware',
            proxyPrefix: '/api/files',
            upstreamOrigin: conf['CONDO_DOMAIN'],
            upstreamPrefix: '/api/files',
            ipProxying: ipProxyConfig ? {
                proxyId: ipProxyConfig.proxyId,
                proxySecret: ipProxyConfig.proxySecret,
                trustProxyFn: () => true,
                knownProxies: trustedProxies,
            } : undefined,
            authorization: async (req, res) => {
                const { accessToken } = await OIDCMiddleware.extractOIDCTokensFromRequest(req, res)

                return {
                    token: accessToken,
                }
            },
        })
    }


    prepareMiddleware () {
        // NOTE: csrf middleware is not required for this endpoint, since global expres app is protected by same-site policy and CORS
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        app.post('/api/files/upload', this._proxyHandler)
        app.post('/api/files/attach', reStreamParsedBody, this._proxyHandler)

        return app
    }
}

module.exports = {
    FileUploadMiddleware: new FileUploadMiddleware(),
}