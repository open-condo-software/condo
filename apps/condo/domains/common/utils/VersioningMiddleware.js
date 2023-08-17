const packageJson = require('@app/condo/package.json')
const express = require('express')
const { get } = require('lodash')

class VersioningMiddleware {
    async prepareMiddleware () {
        // this route can not be used for csrf attack (because no cookies and tokens are used in a public route)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        app.use('/api/version', (req, res) => {
            res.status(200).json({
                build: get(process.env, 'WERF_COMMIT_HASH', packageJson.version),
            })
        })

        return app
    }
}

module.exports = {
    VersioningMiddleware,
}
