const debug = require('debug')('@open-condo/keystone/prepareKeystoneApp')
const express = require('express')

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
    if (configureExpress) configureExpress(app)
    app.use(middlewares)
    return { keystone, app }
}

module.exports = {
    prepareKeystoneExpressApp,
}