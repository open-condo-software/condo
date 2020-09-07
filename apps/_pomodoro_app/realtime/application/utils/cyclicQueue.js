/**
 * Cyclic queue is a queue which resets to it's original position when emptied
 * Master queue is immutable
 */
class CyclicQueue {
    constructor (queue) {
        this._queue = queue
        this._master = queue.slice()
        this.cycles = 0
    }

    pop () {
        const val = this._queue.shift()
        if (this._queue.length === 0) {
            this._queue = this._master.slice()
            this.cycles++
        }
        return val
    }

    current () {
        return this._queue[0]
    }

    peekNext () {
        if (this._queue.length < 2) {
            return this._master[0]
        }
        return this._queue[1]
    }
}

module.exports = CyclicQueue
