const CyclicQueue = require('./utils/cyclicQueue');

const status = {
    'paused':'paused',
    'working':'working',
}

const intervals = {
    'work': 'WORK',
    'break': 'BREAK',
    'bigBreak':'BIG_BREAK'
}

function getIntervalQueue(breakTime, bigBreakTime, worktimeTime) {

    const workInterval = new Interval(intervals.work, worktimeTime)
    const breakInterval = new Interval(intervals.break, breakTime)
    const bigBreakInterval = new Interval(intervals.bigBreak, bigBreakTime)

    return new CyclicQueue([
        workInterval,
        breakInterval,
        workInterval,
        breakInterval,
        workInterval,
        breakInterval,
        workInterval,
        bigBreakInterval
    ])
}

/**
 * Period model
 */
class Interval {
    constructor(name, time) {
        this.name = name
        this.time = time
    }
}

/**
 * Sets timers off, gives away current time, is unique for one team
 */
class Timer {

    constructor(breakTime, bigBreakTime, worktimeTime) {
        this.timer = 0
        this.counterFunction = 0
        this.status = status.paused

        this.intervalQueue = getIntervalQueue(breakTime, bigBreakTime, worktimeTime)
    }

    _incrementTimer() {
        this.timer++
        if(this.getTime() === 0) {
            this._changeInterval()
        }
    }

    _changeInterval() {
        this.timer = 0
        return this.intervalQueue.pop()
    }

    getInterval() {
        return this.intervalQueue.current().name
    }

    getNextInterval() {
        return this.intervalQueue.peekNext().name
    }

    getNextIntervalLength() {
        return this.intervalQueue.peekNext().time
    }

    start() {
        if (this.status === status.paused) {
            this.counterFunction = setInterval(() => { this._incrementTimer() }, 1000)
            this.status = status.working
        }
    }

    pause() {
        if (this.status === status.working) {
            clearInterval(this.counterFunction)
            this.counterFunction = 0
            this.status = status.paused
        }
    }

    reset() {
        this.timer = 0
    }

    isPaused() {
        return this.status === status.paused
    }

    getTime() {
        return this.intervalQueue.current().time - this.timer
    }
}

module.exports = Timer
