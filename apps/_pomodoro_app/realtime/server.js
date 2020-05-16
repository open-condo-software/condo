const http = require('http')
const socketio = require('socket.io')
const port = parseInt(process.env.PORT || '3001')
const express = require('express')
const { init } = require('./index')

async function prepareSocketIOServer(server) {
    const io = socketio(server)
    init(io)
}

async function initServer (port) {
    const app = express()
    app.set('port', port)
    const server = http.createServer(app)
    await prepareSocketIOServer(server)
    return server.listen(port)
}

module.exports = {
    start: () => initServer(port).then(() => console.log(` SERVER started at port: ${port}`))
};
