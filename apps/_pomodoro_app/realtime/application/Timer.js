const intervals = {
    'every_second': 1000
}

const status = {
    'paused':'paused',
    'working':'working',
}

/**
 * Sets timers off, gives away current time, is unique for one team
 */
class Timer {

    constructor() {
        this.timer = 0
        this.counter = 0
        this.status = status.paused
    }

    getTime() {
        return this.timer
    }

    start() {
        if (this.status === status.paused) {
            this.counter = setInterval(() => this.timer++, intervals.every_second)
            this.status = status.working
        }
    }

    pause() {
        if (this.status === status.working) {
            clearInterval(this.counter)
            this.counter = 0
            this.status = status.paused
        }
    }

    reset() {
        this.timer = 0
    }

    isPaused() {
        return this.status === status.paused
    }
}

module.exports = Timer
