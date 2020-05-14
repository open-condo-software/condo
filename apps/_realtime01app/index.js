function init (io) {
    io.on('connection', (socket) => {
        console.log(socket.id, 'a user connected')

        socket.on('chat message', (msg) => {
            console.log('message', socket.id, msg)
            io.emit('chat message', msg)
        })

        socket.on('disconnect', () => {
            console.log(socket.id, 'user disconnected')
        })
    })
}

module.exports = {
    init,
}
