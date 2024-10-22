const fs = require('fs')
const path = require('path')

const express = require('express')

const conf = require('@open-condo/config')


const SERVER_URL = conf['SERVER_URL'] || 'http://localhost:3000'

class GraphiqlApp {
    constructor ({
        apiPath = '/admin/api',
        graphiqlPath = '/admin/api',
    } = {}) {
        this._graphiqlHtml = this.prepareHtml(apiPath)
        this._graphiqlPath = graphiqlPath
    }

    prepareHtml (apiPath) {
        const fileBuffer = fs.readFileSync(path.join(__dirname, 'graphiql.html'))
        const html = fileBuffer.toString()
        return html
            .replace('__REPLACE_TO_YOUR_API_PATH__', apiPath)
            .replace('__REPLACE_TO_YOUR_SERVER_URL__', SERVER_URL)
    }

    async prepareMiddleware () {
        // nosemrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        app.get(this._graphiqlPath, (req, res) => {
            return res.send(this._graphiqlHtml)
        })
        return app
    }
}

module.exports = {
    GraphiqlApp,
}
