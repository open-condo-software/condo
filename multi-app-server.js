const express = require('express')
const http = require('http')

const PORT = parseInt(process.env.PORT || '3000')
let BACKENDS = []

function initModules (modules) {
    BACKENDS = modules.map((m) => require(m + '/multi-app-support'))
}

async function initServer (port) {
    const app = await initApp()
    app.set('port', port)
    const server = http.createServer(app)
    await Promise.all(BACKENDS.map(async (back) => {
        if (!back.prepareBackServer) return
        await back.prepareBackServer(server)
        console.log(`MULTI-SERVER: PATCH SERVER BY ${back.NAME}`)
    }))
    return server.listen(port)
}

async function initApp () {
    const app = express()
    await Promise.all(BACKENDS.map(async (back) => {
        if (!back.prepareBackApp) return
        const backApp = await back.prepareBackApp()
        if (!backApp) return
        app.use(back.URL_PREFIX, backApp)
        console.log(`MULTI-SERVER: USE APP ${back.NAME} AT URL ${back.URL_PREFIX}`)
    }))
    return app
}

const modules = process.argv.slice(2);
if (modules.length <= 0) {
    console.error('You should pass related apps paths')
    console.error('USE: node multi-app-server.js @app/_back02keystone @app/_example05app @app/_realtime01app')
    process.exit(1)
}

initModules(modules)
initServer(PORT).then(() => {
    console.log(`MULTI-SERVER: READY on ${PORT}`)
})
