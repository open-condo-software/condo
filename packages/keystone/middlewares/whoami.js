const express = require('express')

class WhoAmIMiddleware {
    endpoint = '/api/whoami'

    constructor ({ endpoint } = {}) {
        if (endpoint) {
            this.endpoint = endpoint
        }
    }

    async prepareMiddleware () {
        const app = express()

        app.get(this.endpoint, function (req, res) {
            // TODO(SavelevMatthew): INFRA-1057 Enhance this API with location, target, user.id, rate-limits
            const data = {
                ip: req.ip,
            }

            res.json(data)
        })

        return app
    }
}

module.exports = {
    WhoAmIMiddleware,
}