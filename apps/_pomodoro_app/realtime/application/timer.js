const CyclicQueue = require('./utils/cyclicQueue')

const status = {
    paused: 'paused',
    working: 'working',
}

const periods = {
    work: 'WORK',
    break: 'BREAK',
    bigBreak: 'BIG_BREAK',
}

function getPeriodQueue (breakTime, bigBreakTime, worktimeTime) {
    const workPeriod = new Period(periods.work, worktimeTime)
    const breakPeriod = new Period(periods.break, breakTime)
    const bigBreakPeriod = new Period(periods.bigBreak, bigBreakTime)

    return new CyclicQueue([
        workPeriod,
        breakPeriod,
        workPeriod,
        breakPeriod,
        workPeriod,
        breakPeriod,
        workPeriod,
        bigBreakPeriod,
    ])
}

/**
 * Period model
 */
class Period {
    constructor (name, time) {
        this.name = name
        this.time = time
    }
}

/**
 * Sets timers off, gives away current time, is unique for one team
 */
class Timer {
    constructor (breakTime, bigBreakTime, worktimeTime) {
        this.timer = 0
        this.counterFunction = undefined
        this.status = status.paused

        this.periodQueue = getPeriodQueue(breakTime, bigBreakTime, worktimeTime)
    }

    _incrementTimer () {
        this.timer++
        if (this.getTime() === 0) {
            this._changePeriod()
        }
    }

    _changePeriod () {
        this.timer = 0
        return this.periodQueue.pop()
    }

    getPeriod () {
        return this.periodQueue.current().name
    }

    getNextPeriod () {
        return this.periodQueue.peekNext().name
    }

    getNextPeriodLength () {
        return this.periodQueue.peekNext().time
    }

    start () {
        if (this.status === status.paused) {
            this.counterFunction = setInterval(() => {
                this._incrementTimer()
            }, 1000)
            this.status = status.working
        }
    }

    pause () {
        if (this.status === status.working) {
            clearInterval(this.counterFunction)
            this.counterFunction = undefined
            this.status = status.paused
        }
    }

    reset () {
        this.timer = 0
    }

    isPaused () {
        return this.status === status.paused
    }

    getTime () {
        return this.periodQueue.current().time - this.timer
    }
}

module.exports = Timer
