const Timer = require('./application/Timer')
const SimpleAuthMiddleware = require('./application/SimpleAuthMiddleware')
const ConsoleLogger = require('./application/ConsoleLogger')
const Repository = require('./application/Repository')


/**
 * Realtime server that handles the pomodoro timer application
 * TODO When socket dies we fire out an logger request to create statistics
 * @param io - Socket.io namespace
 * @param logger - an AbstractLogger impl
 * @param auth - an AbstractAuthMiddleware impl
 * @param repo - an AbstractRepository impl
 */
function init (io, logger=new ConsoleLogger(), auth=SimpleAuthMiddleware, repo=new Repository()) {

    /**
     * Active timers storage
     * @type {{string, Timer}}
     */
    const timers = {}

    function _forgeTimer(id, time, period, nextPreiod, nextPeriodLength, paused) {
        return {
            id:id,
            time:time,
            period:period,
            nextPeriod:nextPreiod,
            nextPeriodLength:nextPeriodLength,
            paused:paused
        }
    }

    function _emitTimerEvent(nsp, timer, id) {
       nsp.emit('timer', _forgeTimer(id, timer.getTime(), timer.getInterval(), timer.getNextInterval(), timer.getNextIntervalLength(), timer.isPaused()))
    }

    io.use(auth.auth)

    io.on('connection', (socket) => {
        const id = socket.request._query['timer']

        socket.join(id)

        // If timer wasnt present in system beforehand -> check the repository for data,
        // if null -> create a new timer with default values
        //todo(toplenboren) rewrite
        if (!timers.hasOwnProperty(id)) {
            try {
                const data = repo.getEntityById(id)
                console.log(data)
                timers[id] = new Timer(data.breakTime, data.bigBreakTime, data.workTimeTime)
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
            _emitTimerEvent(io.in(id), timer, id)
            logger.log(`started timer for ${id}`)
        })

        socket.on('pause', () => {
            timer.pause()
            _emitTimerEvent(io.in(id), timer, id)
            logger.log(`paused timer for ${id}`)
        })

        socket.on('clear', () => {
            timer.pause()
            timer.reset()
            _emitTimerEvent(io.in(id), timer, id)
            logger.log(`timer was cleared for ${id}`)
        })

        socket.on('check', () => {
            _emitTimerEvent(socket, timer, id)
            logger.log(timer.getTime())
        })
    })
}

module.exports = {
    init,
}
