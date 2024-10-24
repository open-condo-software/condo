const { DEFAULT_DIST_DIR } = require('@keystonejs/keystone/constants')
const debug = require('debug')('@open-condo/keystone/prepareKeystoneApp')
const express = require('express')

async function prepareKeystoneInstance (entryPoint, { excludeApps } = {}) {
    debug('prepareKeystoneInstance(%s) excludeApps=%j cwd=%s', entryPoint, excludeApps, process.cwd())
    const dev = process.env.NODE_ENV === 'development'
    const {
        keystone,
        apps,
        configureExpress,
        cors,
        pinoOptions,
        distDir,
    } = (typeof entryPoint === 'string') ? require(entryPoint) : entryPoint
    const newApps = (excludeApps) ? apps.filter(x => !excludeApps.includes(x.constructor.name)) : apps
    return { keystone, apps: newApps, dev, configureExpress, cors, pinoOptions, distDir: distDir || DEFAULT_DIST_DIR }
}

async function prepareKeystoneExpressApp (entryPoint, { excludeApps } = {}) {
    debug('prepareKeystoneExpressApp(%s) excludeApps=%j cwd=%s', entryPoint, excludeApps, process.cwd())
    const { keystone, apps, dev, configureExpress, cors, pinoOptions, distDir } = await prepareKeystoneInstance(entryPoint, { excludeApps })
    const { middlewares } = await keystone.prepare({ apps, dev, cors, pinoOptions, distDir })
    await keystone.connect()

    // not a csrf case: used for test & development scripts purposes
    // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
    const app = express()
    if (configureExpress) configureExpress(app)
    app.use(middlewares)
    return { keystone, app }
}

module.exports = {
    prepareKeystoneInstance,
    prepareKeystoneExpressApp,
}
