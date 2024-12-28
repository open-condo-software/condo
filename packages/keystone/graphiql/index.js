const fs = require('fs')
const path = require('path')

const express = require('express')
const nunjucks = require('nunjucks')


class GraphiqlApp {
    constructor ({
        apiPath = '/admin/api',
        graphiqlPath = '/admin/api',
        allowedQueryParams = [],
    } = {}) {
        if (!apiPath || typeof apiPath !== 'string') throw new Error('"apiPath" should be non empty string')
        if (!graphiqlPath || typeof graphiqlPath !== 'string') throw new Error('"graphiqlPath" should be non empty string')
        if (allowedQueryParams !== null && allowedQueryParams !== undefined && !Array.isArray(allowedQueryParams)) throw new Error('"allowedQueryParams" should be array')

        this._graphiqlPath = graphiqlPath
        this._allowedQueryParams = allowedQueryParams || []
        this._graphiqlHtml = this.#prepareHtml(apiPath)
    }

    #prepareHtml (apiPath) {
        const fileBuffer = fs.readFileSync(path.join(__dirname, 'graphiql.html'))
        const htmlTemplate = fileBuffer.toString()
        return nunjucks.renderString(htmlTemplate, { apiPath })
    }

    async prepareMiddleware () {
        // nosemrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        app.get(this._graphiqlPath, (req, res, next) => {
            const queryParamsKeys = Object.keys(req.query)

            // NOTE: Apollo server can handle get requests with certain query parameters.
            // So we should preserve this behavior and pass the request to next middleware
            if (!queryParamsKeys.every(queryParam => this._allowedQueryParams.includes(queryParam))) {
                return next()
            }

            return res.send(this._graphiqlHtml)
        })

        return app
    }
}

module.exports = {
    GraphiqlApp,
}
