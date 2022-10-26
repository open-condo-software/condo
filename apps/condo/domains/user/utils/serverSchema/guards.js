const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

const conf = require('@condo/config')
const { GQLError } = require('@condo/keystone/errors')
const { getRedisClient } = require('@condo/keystone/redis')

const {
    MAX_SMS_FOR_IP_BY_DAY,
    MAX_SMS_FOR_PHONE_BY_DAY,
    PAYMENT_LINK_WINDOW_SIZE,
    MAX_PAYMENT_LINK_REQUEST_BY_WINDOW,
} = require('@condo/domains/user/constants/common')
const { GQL_ERRORS } = require('@condo/domains/user/constants/errors')

dayjs.extend(utc)

const phoneWhiteList = Object.keys(conf.SMS_WHITE_LIST ? JSON.parse(conf.SMS_WHITE_LIST) : {})
const ipWhiteList = conf.IP_WHITE_LIST ? JSON.parse(conf.IP_WHITE_LIST) : []

class RedisGuard {
    get redis () {
        if (!this._redis) this._redis = getRedisClient('guards')
        return this._redis
    }

    constructor () {
        this.lockPrefix = 'guard_lock:'
        this.counterPrefix = 'guard_counter:'
    }

    async checkLock (lockName, action) {
        const isLocked = await this.isLocked(lockName, action)
        if (isLocked) {
            const secondsRemaining = await this.lockTimeRemain(lockName, action)
            throw new GQLError({
                ...GQL_ERRORS.TOO_MANY_REQUESTS,
                messageInterpolation: {
                    secondsRemaining,
                },
            })
        }
    }

    async checkPaymentLinkLimitCounters (rawIp) {
        const ip = rawIp.split(':').pop()
        await this.checkCustomLimitCounters(
            ip,
            PAYMENT_LINK_WINDOW_SIZE,
            'second',
            MAX_PAYMENT_LINK_REQUEST_BY_WINDOW,
        )
    }

    async checkCustomLimitCounters (variable, windowSize, windowSizeUnit, counterLimit) {
        const expiryAnchorDate = dayjs().add(windowSize, windowSizeUnit)
        const counter = await this.incrementCustomCounter(variable, expiryAnchorDate)
        if (counter > counterLimit) {
            const secondsRemaining = await this.counterTimeRemain(variable)
            throw new GQLError({
                ...GQL_ERRORS.TOO_MANY_REQUESTS,
                messageInterpolation: {
                    secondsRemaining,
                },
            })
        }
    }

    async checkSMSDayLimitCounters (phone, rawIp) {
        const ip = rawIp.split(':').pop()
        const byPhoneCounter = await this.incrementDayCounter(phone)
        if (byPhoneCounter > MAX_SMS_FOR_PHONE_BY_DAY && !phoneWhiteList.includes(phone)) {
            throw new GQLError(GQL_ERRORS.SMS_FOR_PHONE_DAY_LIMIT_REACHED)
        }
        const byIpCounter = await this.incrementDayCounter(ip)
        if (byIpCounter > MAX_SMS_FOR_IP_BY_DAY && !ipWhiteList.includes(ip)) {
            throw new GQLError(GQL_ERRORS.SMS_FOR_IP_DAY_LIMIT_REACHED)
        }
    }

    async incrementDayCounter (variable) {
        return this.incrementCustomCounter(variable, dayjs().endOf('day'))
    }

    // Counter will reset at the start of a day ( or after redis restart )
    // Example usage = only 100 attempts to confirm phone from single IP
    async incrementCustomCounter (variable, date) {
        // if variable not exists - it will be set to 1
        let afterIncrement = await this.redis.incr(`${this.counterPrefix}${variable}`)
        afterIncrement = Number(afterIncrement)
        if (afterIncrement === 1) {
            await this.redis.expireat(`${this.counterPrefix}${variable}`, parseInt(`${date / 1000}`))
        }
        return afterIncrement
    }

    // Counter
    // 1. Set variable to reddis with TTL
    // 2. Check if counter exists
    // 3. Get counter remain time
    async counterTimeRemain (variable) {
        const time = await this.redis.ttl(`${this.counterPrefix}${variable}`)
        // -1: no ttl on variable, -2: key not exists
        return Math.max(time, 0)
    }


    // Lock
    // 1. Set variable to reddis with TTL
    // 2. Check if lock exists
    // 3. Get lock remain time
    // Example usage after failed attempt to confirm phone - lock phoneNumber for some time
    async lockTimeRemain (variable, action = '') {
        const actionFolder = action ? `${action}:` : ''
        const time = await this.redis.ttl(`${this.lockPrefix}${actionFolder}${variable}`)
        // -1: no ttl on variable, -2: key not exists
        return Math.max(time, 0)
    }

    async isLocked (variable, action = '') {
        const actionFolder = action ? `${action}:` : ''
        const value = await this.redis.exists(`${this.lockPrefix}${actionFolder}${variable}`)
        return !!value
    }

    async lock (variable, action = '', ttl = 300) { // ttl - seconds
        const actionFolder = action ? `${action}:` : ''
        await this.redis.set(`${this.lockPrefix}${actionFolder}${variable}`, '1')
        await this.redis.expire(`${this.lockPrefix}${actionFolder}${variable}`, ttl )
    }

}

module.exports = {
    RedisGuard,
}
