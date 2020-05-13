const express = require('express')
const http = require('http')
const port = parseInt(process.env.PORT || '3000')

const back1 = require('./apps/_back02keystone/multi-server')
const back2 = require('./apps/_example05app/multi-server')
const back3 = require('./apps/_realtime01app/multi-server')
const BACKS = [back1, back2, back3]

async function initApp () {
    const app = express()
    await Promise.all(BACKS.map(async (back) => {
        if (!back.prepareBackApp) return
        const backApp = await back.prepareBackApp()
        if (!backApp) return
        app.use(back.URL_PREFIX, backApp)
        console.log(`MULTI-SERVER: USE APP ${back.NAME} AT URL ${back.URL_PREFIX}`)
    }))
    return app
}

async function initServer (port) {
    const app = await initApp()
    app.set('port', port)
    const server = http.createServer(app)
    await Promise.all(BACKS.map(async (back) => {
        if (!back.prepareBackServer) return
        await back.prepareBackServer(server)
        console.log(`MULTI-SERVER: PATCH SERVER BY ${back.NAME}`)
    }))
    return server.listen(port)
}

initServer(port).then(() => {
    console.log(`MULTI-SERVER: READY on ${port}`)
})
