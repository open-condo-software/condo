const Timer = require('./application/Timer')
const SimpleAuthMiddleware = require('./application/SimpleAuthMiddleware')
const ConsoleLogger = require('./application/ConsoleLogger')
const Repository = require('./application/Repository')


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
    const repo = new Repository()


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

        //todo(toplenboren) rewrite
        if (!timers.hasOwnProperty(id)) {
            try {
                const data = repo.getEntityById(id)
                timers[id] = new Timer(data.breakTime, data.bigBreakTime, data.worktimeTime)
            } catch (e) {
                const data = {
                    breakTime:15*60,
                    bigBreakTime:25*60,
                    worktimeTime:25*60
                }
                timers[id] = new Timer(data.breakTime, data.bigBreakTime, data.worktimeTime)
            }
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
