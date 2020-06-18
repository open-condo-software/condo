const Timer = require('./timer')
const authMiddleware = require('./auth')

/**
 * One socket is created for one team
 * Sockets are stored inside an array
 * Sockets die if there are no active connections
 * On connection we auth the socket
 * TODO When socket dies we fire out an http request to create statistics
 * Pipeline: get the team -> get the team timer data -> start session -> run session -> send session to statistics
 * @param io
 */
function init (io) {

    /**
     * Active timers storage
     * @type {{string, Timer}}
     */
    const timers = {}

    io.use(authMiddleware)

    io.on('connection', (socket) => {
        const id = socket.request._query['team']

        if (!timers.hasOwnProperty(id)) {
            timers[id] = new Timer.Timer()
        }

        const timer = timers[id]
        console.log(id, 'a user connected')

        socket.on('start', () => {
            timer.start()
            console.log('started timer', socket.id)
        })

        socket.on('pause', () => {
            timer.pause()
            console.log(id, 'paused timer')
        })

        socket.on('clear', () => {
            timer.pause()
            timer.reset()
            console.log('timer was cleared')
        })
    })
}

module.exports = {
    init,
}
