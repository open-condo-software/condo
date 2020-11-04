const Timer = require('./application/timer')

/**
 * Socket auth middleware
 * https://socket.io/docs/migrating-from-0-9/
 * @param socket
 * @param next
 */
function auth (socket, next) {
    const handshakeData = socket.request
    console.log('auth-d', handshakeData._query['timer'])
    next()
}

/**
 * Realtime server that handles the pomodoro timer application
 * TODO When socket dies we fire out an logger request to create statistics
 * @param io - Socket.io namespace
 * @param store — Storage for timer meta information
 */
function init (io, store) {
    /**
     * Active timers storage
     * @type {{string, Timer}}
     */
    const timers = {}

    /**
     * Forges and emits an event
     * @param nsp where to emit event
     * @param timer
     * @param id
     * @private
     */
    function _emitTimerEvent (nsp, timer, id) {
        nsp.emit('timer', {
            id,
            time: timer.getTime(),
            period: timer.getPeriod(),
            nextPeriod: timer.getNextPeriod(),
            nextPeriodLength: timer.getNextPeriodLength(),
            paused: timer.isPaused(),
        })
    }

    io.use(auth)

    io.on('connection', (socket) => {
        const id = socket.request._query['timer']

        socket.join(id)

        // If timer wasnt present in system beforehand -> check the repository for data,
        // if null -> create a new timer with default values
        //todo(toplenboren) rewrite
        if (!timers.hasOwnProperty(id)) {
            try {
                const data = store.getEntityById(id)
                console.log(data)
                timers[id] = new Timer(data.breakTime, data.bigBreakTime, data.workTimeTime)
            } catch (e) {
                const data = {
                    breakTime: 15 * 60,
                    bigBreakTime: 25 * 60,
                    worktimeTime: 25 * 60,
                }
                timers[id] = new Timer(data.breakTime, data.bigBreakTime, data.worktimeTime)
            }
        }
        const timer = timers[id]
        console.log(`timer ${id} has one more connection`)

        socket.on('start', () => {
            timer.start()
            _emitTimerEvent(io.in(id), timer, id)
            console.log(`started timer for ${id}`)
        })

        socket.on('clear', () => {
            timer.pause()
            timer.reset()
            _emitTimerEvent(io.in(id), timer, id)
            console.log(`timer was cleared for ${id}`)
        })

        socket.on('pause', () => {
            timer.pause()
            _emitTimerEvent(io.in(id), timer, id)
            console.log(`paused timer for ${id}`)
        })

        socket.on('check', () => {
            _emitTimerEvent(socket, timer, id)
            console.log(timer.getTime())
        })
    })
}

module.exports = {
    init,
}
