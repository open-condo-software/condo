const http = require('http')
const socketio = require('socket.io')
const express = require('express')
const port = parseInt(process.env.PORT || '3001')
const { init } = require('./pomodoroSocketIOServer')
const prepareBackApp = require('./pomodoroExpressBackend')

//Deps, todo(toplenboren) make DI
const ConsoleLogger = require('./application/ConsoleLogger')
const SimpleAuthMiddleware = require('./application/SimpleAuthMiddleware')
const StoreRepo = require('./store/store')
const LinkGenerator = require('./application/LinkGenerator')

async function prepareSocketIOServer(server) {
    const io = socketio(server)
    init(io, new ConsoleLogger(), SimpleAuthMiddleware, StoreRepo)
}

async function initServer (port) {
    const app = await prepareBackApp(LinkGenerator, StoreRepo)
    app.set('port', port)
    const server = http.createServer(app)
    await prepareSocketIOServer(server)
    return server.listen(port)
}

module.exports = {
    start: () => initServer(port).then(() => console.log(` SERVER started at port: ${port}`))
};
