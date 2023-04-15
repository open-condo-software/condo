const packageJson = require('@app/condo/package.json')
const express = require('express')
const { get } = require('lodash')

class VersioningMiddleware {
    async prepareMiddleware () {
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
