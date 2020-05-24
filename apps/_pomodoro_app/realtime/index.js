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
    let timerValue = 0;
    let timerIsAlive = false;
    let timer;

    /**
     * Active timers storage
     * @type {{Timer}}
     */
    const timers = {}

    io.on('connection', (socket) => {
        console.log("check auth")
        if (!timers.hasOwnProperty(socket.id)) {
            timers[socket.id] = Timer()
        }

        const timer = timers[id]
        console.log(socket.id, 'a user connected')

        socket.on('start', (msg) => {
            timer.start()
            console.log('started timer', socket.id)
        })

        socket.on('pause', () => {
            timer.pause()
            console.log(socket.id, 'paused timer')
        })

        socket.on('clear', () => {
            timer.pause()
            timer.clear()
            console.log('timer was cleared')
        })
    })
}

module.exports = {
    init,
}
