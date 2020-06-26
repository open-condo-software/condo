const Timer = require('./application/Timer')
const SimpleAuthMiddleware = require('./application/SimpleAuthMiddleware')
const ConsoleLogger = require('./application/ConsoleLogger')


/**
 * One socket is created for one id
 * TODO When socket dies we fire out an logger request to create statistics
 * @param io
 * @param logger
 * @param auth
 */
function init (io, logger=new ConsoleLogger(), auth=SimpleAuthMiddleware) {

    /**
     * Active timers storage
     * @type {{string, Timer}}
     */
    const timers = {}

    function forgeTimer(id, time, period, nextPreiod, nextPeriodLength, paused) {
        return {
            id:id,
            time:time,
            period:period,
            nextPeriod:nextPreiod,
            nextPeriodLength:nextPeriodLength,
            paused:paused
        }
    }

    function _emitTimerEvent(io, timer, id) {
        io.in(id).emit('timer', forgeTimer(id, timer.getTime(), timer.getInterval(), timer.getNextInterval(), timer.getNextIntervalLength(), timer.isPaused()))
    }

    io.use(auth.auth)

    io.on('connection', (socket) => {
        const id = socket.request._query['timer']

        socket.join(id)

        if (!timers.hasOwnProperty(id)) {
            timers[id] = new Timer(15*60, 25*60, 25*60)
        }

        const timer = timers[id]
        logger.log(`timer ${id} has one more connection`)

        socket.on('start', () => {
            timer.start()
            _emitTimerEvent(io, timer, id)
            logger.log(`started timer for ${id}`)
        })

        socket.on('pause', () => {
            timer.pause()
            _emitTimerEvent(io, timer, id)
            logger.log(`paused timer for ${id}`)
        })

        socket.on('clear', () => {
            timer.pause()
            timer.reset()
            _emitTimerEvent(io, timer, id)
            logger.log(`timer was cleared for ${id}`)
        })

        socket.on('check', () => {
            _emitTimerEvent(io, timer, id)
            logger.log(timer.getTime())
        })
    })
}

module.exports = {
    init,
}
