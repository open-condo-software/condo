const http = require('http')
const express = require('express')
const { keystone, apps } = require('./index.js')
const realtime = require('./realtime/server')
const port = parseInt(process.env.PORT || '3001')

// todo(toplenboren) Remove Keystone.js — we don't need it
keystone
    .prepare({
        apps: apps,
        dev: process.env.NODE_ENV !== 'production',
    })
    .then(async ({ middlewares }) => {
        await keystone.connect()
        const app = express()

        app.use(middlewares)

        const server = http.createServer(app)
        await realtime.socketIOPrepare(server)
        server.listen(port)
    })
