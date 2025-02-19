const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

const { getKVClient } = require('@open-condo/keystone/kv')

dayjs.extend(utc)

class RedisGuard {
    constructor () {
        this.counterPrefix = 'guard_counter'
    }

    get redis () {
        if (!this._redis) this._redis = getKVClient('guards')
        return this._redis
    }

    async incrementDayCounter (key) {
        const endOfDay = dayjs().endOf('day')
        const dailyKey = [this.counterPrefix, endOfDay.format('YYYY_MM_DD'), key].join(':')
        const afterIncrement = await this.redis.incr(dailyKey)

        if (afterIncrement === 1) {
            const expireAtUnixSeconds = Math.floor(endOfDay / 1000)
            await this.redis.expireat(dailyKey, expireAtUnixSeconds)
        }

        return afterIncrement
    }

    async getDayCounter (key) {
        const endOfDay = dayjs().endOf('day')
        const dailyKey = [this.counterPrefix, endOfDay.format('YYYY_MM_DD'), key].join(':')
        const counterValue = this.redis.get(dailyKey)

        return counterValue || 0
    }
}

module.exports = {
    RedisGuard,
}
