const fs = require('fs')
const path = require('path')

const express = require('express')
const nunjucks = require('nunjucks')

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
        const htmlTemplate = fileBuffer.toString()
        return nunjucks.renderString(htmlTemplate, { apiPath, serverUrl: SERVER_URL + this.graphiqlPath })
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
