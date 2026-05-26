const express = require('express')

const conf = require('@open-condo/config')
const { createProxy } = require('@open-condo/miniapp-utils/helpers/proxying')

const { OIDCMiddleware } = require('./OIDCMiddleware')

class FileUploadMiddleware {
    constructor () {
        // TODO: make sure it exists on prod / dev / prepare
        const ipProxyConfig = conf['CONDO_PROXY_CONFIG'] ? JSON.parse(conf['CONDO_PROXY_CONFIG']) : null
        const trustedProxies = conf['TRUSTED_PROXIES_CONFIG'] ? JSON.parse(conf['TRUSTED_PROXIES_CONFIG']) : undefined

        this._proxyHandler = createProxy({
            name: 'DevPortalUploadMiddleware',
            proxyPrefix: '/api/files/upload',
            upstreamOrigin: conf['CONDO_DOMAIN'],
            upstreamPrefix: '/api/files/upload',
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
        const app = express()
        app.post('/api/files/upload', this._proxyHandler)

        return app
    }
}

module.exports = {
    FileUploadMiddleware: new FileUploadMiddleware(),
}