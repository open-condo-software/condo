const conf = require('@core/config')
const IORedis = require('ioredis')
const REDIS_URL = conf['REDIS_URL']
const { utc } = require('moment')
const {
    ApolloError,
} = require('apollo-errors')
const {
    SMS_FOR_IP_DAY_LIMIT_REACHED,
    SMS_FOR_PHONE_DAY_LIMIT_REACHED,
    TOO_MANY_REQUESTS,
} = require('@condo/domains/user/constants/errors')

const {
    MAX_SMS_FOR_IP_BY_DAY,
    MAX_SMS_FOR_PHONE_BY_DAY,
} = require('@condo/domains/user/constants/common')

const phoneWhiteList = Object.keys(conf.SMS_WHITE_LIST ? JSON.parse(conf.SMS_WHITE_LIST) : {})
const ipWhiteList = conf.IP_WHITE_LIST ? JSON.parse(conf.IP_WHITE_LIST) : []
class RedisGuard {

    constructor () {
        this.db = new IORedis(REDIS_URL)
        this.lockPrefix = 'guard_lock:'
        this.counterPrefix = 'guard_counter:'
    }

    async checkLock (lockName, action) {
        const isLocked = await this.isLocked(lockName, action)
        if (isLocked) {
            const timeRemain = await this.lockTimeRemain(lockName, action)
            throw new ApolloError(`${TOO_MANY_REQUESTS}]`, {
                message: `${TOO_MANY_REQUESTS}] resend timeout not expired`,
                data: {
                    time: new Date().toISOString(),
                    timeRemain,
                },
            })
        }
    }

    async checkSMSDayLimitCounters (phone, rawIp) {
        const ip = rawIp.split(':').pop()
        const byPhoneCounter = await this.incrementDayCounter(phone)
        if (byPhoneCounter > MAX_SMS_FOR_PHONE_BY_DAY && !phoneWhiteList.includes(phone)) {
            throw new Error(`${SMS_FOR_PHONE_DAY_LIMIT_REACHED}] too many sms requests for this phone number. Try again tomorrow`)
        }
        const byIpCounter = await this.incrementDayCounter(ip)
        if (byIpCounter > MAX_SMS_FOR_IP_BY_DAY && !ipWhiteList.includes(ip)) {
            throw new Error(`${SMS_FOR_IP_DAY_LIMIT_REACHED}] too many sms requests from this ip address. Try again tomorrow`)
        }
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
