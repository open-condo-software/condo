const http = require('http')
const socketio = require('socket.io')
const express = require('express')
const port = parseInt(process.env.PORT || '3001')

const { init } = require('./pomodoroSocketIOServer')
const prepareBackApp = require('./pomodoroExpressBackend')
const store = require('./store/store')
const { generateLink } = require('./application/utils')

async function prepareSocketIOServer(server) {
    const io = socketio(server)
    init(io, store)
}

async function initServer (port) {
    const app = await prepareBackApp(store)
    app.set('port', port)
    const server = http.createServer(app)
    await prepareSocketIOServer(server)
    return server.listen(port)
}

module.exports = {
    start: () => initServer(port).then(() => console.log(` SERVER started at port: ${port}`))
};
