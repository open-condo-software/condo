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

            // NOTE:
            // 1. express can modify req.url when handling routes via app.use('/some-prefix', handler),
            // so req.url inside handler is '/path' instead of '/some-prefix/path'
            // 2. getRequestIp util is framework-agnostic and expects generic node's Incoming Message
            // So we need to make express request behave back like Node native request
            const modifiedReq = new Proxy(this, {
                get (target, p, receiver) {
                    if (p === 'url') {
                        return target.originalUrl || target.url
                    }
                    return Reflect.get(target, p, receiver)
                },
            })

            return getRequestIp(modifiedReq, trustProxyFn, knownProxies)
        },
    })

    if (configureExpress) configureExpress(app)
    app.use(middlewares)
    return { keystone, app }
}

module.exports = {
    prepareKeystoneExpressApp,
}