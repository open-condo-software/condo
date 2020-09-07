const http = require('http')
const socketio = require('socket.io')
const port = parseInt(process.env.PORT || '3001')

const { init } = require('./pomodoroSocketIOServer')
const prepareBackApp = require('./pomodoroExpressBackend')
const Store = require('./store/store')

const storage = new Store()

async function prepareSocketIOServer (server) {
    const io = socketio(server)
    init(io, storage)
}

async function initServer (port) {
    const app = await prepareBackApp(storage)
    app.set('port', port)
    const server = http.createServer(app)
    await prepareSocketIOServer(server)
    return server.listen(port)
}

module.exports = {
    start: () => initServer(port).then(() => console.log(` SERVER started at port: ${port}`)),
    socketIOPrepare: (srv) => prepareSocketIOServer(srv),
    expressPrepare: () => prepareBackApp(storage),
}
