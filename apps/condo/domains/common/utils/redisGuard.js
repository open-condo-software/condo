const conf = require('@core/config')
const IORedis = require('ioredis')
const WORKER_REDIS_URL = conf['WORKER_REDIS_URL']
const { utc } = require('moment')

class RedisGuard {

    constructor () {
        this.db = new IORedis(WORKER_REDIS_URL)
        this.lockPrefix = 'LOCK_'
        this.counterPrefix = 'COUNTER_BY_DAY_'
    }

    // Counter will reset at the start of a day ( or after redis restart )
    // Example usage = only 100 attempts to confirm phone from single IP
    async incrementDayCounter (variable) {
        // if variable not exists - it will be set to 1
        let afterIncrement = await this.db.incr(`${this.counterPrefix}${variable}`)
        afterIncrement = Number(afterIncrement)
        if (afterIncrement === 1) {
            await this.db.expireat(`${this.counterPrefix}${variable}`, parseInt(utc().endOf('day') / 1000) )
        }
        return afterIncrement
    }

    // Lock
    // 1. Set variable to reddis with TTL
    // 2. Check if lock exists
    // 3. Get lock remain time
    // Example usage after failed attempt to confirm phone - lock phoneNumber for some time
    async lockTimeRemain (variable, action = '') {
        const time = await this.db.ttl(`${this.lockPrefix}${action}${variable}`)
        // -1: no ttl on variable, -2: key not exists
        return Math.max(time, 0)
    }

    async isLocked (variable, action = '') {
        const value = await this.db.exists(`${this.lockPrefix}${action}${variable}`)
        return !!value
    }

    async lock (variable, action = '', ttl = 300) { // ttl - seconds
        await this.db.set(`${this.lockPrefix}${action}${variable}`, '1')
        await this.db.expire(`${this.lockPrefix}${action}${variable}`, ttl )
    }

}

module.exports = {
    RedisGuard,   
}
