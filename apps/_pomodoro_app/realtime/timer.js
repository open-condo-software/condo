const intervals = {
    'every_second': 1000
}

/**
 * Sets timers off, gives away current time, is unique for one team
 */
class Timer {

    constructor() {
        this.timer = 0
        this.counter = 0
    }

    getTime() {
        return this.timer
    }

    start() {
        this.counter = setInterval(() => this.timer++, intervals.every_second)
    }

    pause() {
        clearInterval(this.counter)
    }

    reset() {
        this.timer = 0
    }
}

module.exports = {
    Timer: Timer
}
