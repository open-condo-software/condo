const express = require('express')
const socketio = require('socket.io')
const { init } = require('./index')

const URL_PREFIX = '/'
const NAME = 'REALTIME01SOCKETIO'

async function prepareBackServer (server) {
    const io = socketio(server)
    init(io)
}

async function prepareBackApp () {
    const app = express()
    app.get('/test.html', (req, res) => {
        res.sendFile(__dirname + '/test.html')
    })
    return app
}

module.exports = {
    NAME,
    URL_PREFIX,
    prepareBackApp,
    prepareBackServer,
}
