const Timer = require('./application/Timer')
const SimpleAuthMiddleware = require('./application/SimpleAuthMiddleware')
const ConsoleLogger = require('./application/ConsoleLogger')


/**
 * One socket is created for one id
 * TODO When socket dies we fire out an logger request to create statistics
 * Pipeline: get the timer for socket -> start session ->
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
            timer:time,
            period:period,
            nextPeriod:nextPreiod,
            nextPeriodLength:nextPeriodLength,
            paused:paused
        }
    }

    io.use(auth.auth)

    io.on('connection', (socket) => {
        const id = socket.request._query['team']

        if (!timers.hasOwnProperty(id)) {
            timers[id] = new Timer()
        }

        const timer = timers[id]
        logger.log(`timer ${id} has one more connection`)

        socket.on('start', () => {
            timer.start()
            socket.emit('timer', forgeTimer(id, timer.getTime(), 'WORK', 'BREAK', 20, timer.isPaused()))
            logger.log(`started timer for ${id}`)
        })

        socket.on('pause', () => {
            timer.pause()
            socket.emit('timer', forgeTimer(id, timer.getTime(), 'WORK', 'BREAK', 20, timer.isPaused()))
            logger.log(`paused timer for ${id}`)
        })

        socket.on('clear', () => {
            timer.pause()
            timer.reset()
            socket.emit('timer', forgeTimer(id, timer.getTime(), 'WORK', 'BREAK', 20, timer.isPaused()))
            logger.log(`timer was cleared for ${id}`)
        })

        /**
         * A method is used only for testing purposes
         */
        socket.on('check', () => {
            socket.emit('timer', forgeTimer(id, timer.getTime(), 'WORK', 'BREAK', 20, timer.isPaused()))
            logger.log(timer.getTime())
        })
    })
}

module.exports = {
    init,
}
