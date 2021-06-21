const conf = require('@core/config')
const IORedis = require('ioredis')
// TODO(zuch) : remove WORKER_REDIS_URL when .env will be updated
const REDIS_URL = conf['REDIS_URL'] || conf['WORKER_REDIS_URL']
const { utc } = require('moment')

class RedisGuard {

    constructor () {
        this.db = new IORedis(REDIS_URL)
        this.lockPrefix = 'guard_lock:'
        this.counterPrefix = 'guard_counter:'
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
        const actionFolder = action ? `${action}:` : ''
        const time = await this.db.ttl(`${this.lockPrefix}${actionFolder}${variable}`)
        // -1: no ttl on variable, -2: key not exists
        return Math.max(time, 0)
    }

    async isLocked (variable, action = '') {
        const actionFolder = action ? `${action}:` : ''
        const value = await this.db.exists(`${this.lockPrefix}${actionFolder}${variable}`)
        return !!value
    }

    async lock (variable, action = '', ttl = 300) { // ttl - seconds
        const actionFolder = action ? `${action}:` : ''
        await this.db.set(`${this.lockPrefix}${actionFolder}${variable}`, '1')
        await this.db.expire(`${this.lockPrefix}${actionFolder}${variable}`, ttl )
    }

}

module.exports = {
    RedisGuard,
}
