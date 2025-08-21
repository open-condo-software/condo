const debug = require('debug')('@open-condo/keystone/prepareKeystoneApp')
const express = require('express')

const conf = require('@open-condo/config')
const { getRequestIp } = require('@open-condo/miniapp-utils/helpers/proxying')

async function prepareKeystoneExpressApp (entryPoint, { excludeApps } = {}) {
    debug('prepareKeystoneExpressApp(%s) excludeApps=%j cwd=%s', entryPoint, excludeApps, process.cwd())
    const dev = process.env.NODE_ENV === 'development'
    const {
        keystone,
        apps,
        configureExpress,
        cors,
        pinoOptions,
    } = (typeof entryPoint === 'string') ? require(entryPoint) : entryPoint
    const newApps = (excludeApps) ? apps.filter(x => !excludeApps.includes(x.constructor.name)) : apps
    const { middlewares } = await keystone.prepare({ apps: newApps, dev, cors, pinoOptions })
    await keystone.connect()

    // not a csrf case: used for test & development scripts purposes
    // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
    const app = express()

    const knownProxies = JSON.parse(conf['TRUSTED_PROXIES_CONFIG'] || '{}')
    // NOTE: from https://expressjs.com/en/guide/overriding-express-api.html
    Object.defineProperty(app.request, 'ip', {
        enumerable: true,
        configurable: true,
        get () {
            // NOTE: SRC: https://github.com/expressjs/express/blob/4.x/lib/request.js#L350
            const trustProxyFn = this.app.get('trust proxy fn')
            return getRequestIp(this, trustProxyFn, knownProxies)
        },
    })

    if (configureExpress) configureExpress(app)
    app.use(middlewares)
    return { keystone, app }
}

module.exports = {
    prepareKeystoneExpressApp,
}