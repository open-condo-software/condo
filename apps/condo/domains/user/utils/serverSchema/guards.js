const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const cloneDeep = require('lodash/cloneDeep')

const { GQLError } = require('@open-condo/keystone/errors')
const { getKVClient } = require('@open-condo/keystone/kv')

const { GQL_ERRORS } = require('@condo/domains/user/constants/errors')

dayjs.extend(utc)

class RedisGuard {
    get redis () {
        if (!this._redis) this._redis = getKVClient('guards')
        return this._redis
    }

    constructor () {
        this.lockPrefix = 'guard_lock:'
        this.counterPrefix = 'guard_counter:'
    }

    /**
     *
     * @param {string} lockName
     * @param {string} action
     * @param {Object | undefined} context - Keystone context
     * @return {Promise<void>}
     */
    async checkLock (lockName, action, context = undefined) {
        const isLocked = await this.isLocked(lockName, action)
        if (isLocked) {
            const secondsRemaining = await this.lockTimeRemain(lockName, action)
            const minutesRemaining = Math.ceil(secondsRemaining / 60) || 1
            throw new GQLError({
                ...GQL_ERRORS.TOO_MANY_REQUESTS,
                messageInterpolation: {
                    minutesRemaining,
                },
            }, context)
        }
    }

    /**
     *
     * @param {string} variable
     * @param {number} windowSizeInSec
     * @param {number} counterLimit
     * @param {Object | undefined} context - Keystone context
     * @return {Promise<void>}
     */
    async checkCustomLimitCounters (variable, windowSizeInSec, counterLimit, context) {
        const counter = await this.incrementCustomCounter(variable, windowSizeInSec)
        if (counter > counterLimit) {
            const secondsRemaining = await this.counterTimeRemain(variable)
            const minutesRemaining = Math.ceil(secondsRemaining / 60) || 1
            throw new GQLError({
                ...GQL_ERRORS.TOO_MANY_REQUESTS,
                messageInterpolation: {
                    minutesRemaining,
                },
            }, context)
        }
    }

    /**
     * Increments all counters and then checks the limits
     *
     * @param {{key: string, windowSizeInSec: number, windowLimit: number}[]} countersData
     * @param {Object | undefined} context - Keystone context
     * @return {Promise<void>}
     */
    async checkMultipleCustomLimitCounters (countersData, context) {
        /**
         * @type {{key: string, windowSizeInSec: number, windowLimit: number, isBlocked?: boolean, secondsRemaining?: number}[]}
         * @private
         */
        const _countersData = cloneDeep(countersData)

        /**
         * @type {Array<number>}
         */
        const counters = await Promise.all(_countersData.map(({ key }) => this.redis.incr(`${this.counterPrefix}${key}`)))

        const expireatPromises = []
        for (let i = 0; i < _countersData.length; i++) {
            const guard = _countersData[i]
            const counter = counters[i]

            // if variable not exists - it will be set to 1
            if (counter === 1) {
                const expiryAnchorDate = dayjs().add(guard.windowSizeInSec, 'second')
                expireatPromises.push(this.redis.expireat(`${this.counterPrefix}${guard.key}`, parseInt(`${expiryAnchorDate / 1000}`)))
            }

            guard.isBlocked = counter > guard.windowLimit
            if (guard.isBlocked) {
                guard.secondsRemaining = await this.counterTimeRemain(guard.key)
            }
        }
        await Promise.all(expireatPromises)

        const isBlocked = _countersData.some(guard => guard.isBlocked)

        const maxSecondsRemaining = Math.max(..._countersData.map(guard => guard?.secondsRemaining ?? 0))
        const maxMinutesRemaining = Math.ceil(maxSecondsRemaining / 60) || 1

        if (isBlocked) {
            throw new GQLError({
                ...GQL_ERRORS.TOO_MANY_REQUESTS,
                messageInterpolation: {
                    minutesRemaining: maxMinutesRemaining,
                },
            }, context)
        }
    }

    async incrementDayCounter (variable) {
        const now = dayjs()
        const endOfDay = now.endOf('day')
        const ttl = Math.ceil(endOfDay.diff(now, 'seconds', true)) // true - to preserve fractional precision, ceil rounds up
        return this.incrementCustomCounter(variable, ttl)
    }

    // Counter will reset at the start of a day ( or after redis restart )
    // Example usage = only 100 attempts to confirm phone from single IP
    async incrementCustomCounter (variable, ttl) {
        // if variable not exists - it will be set to 1
        let afterIncrement = await this.redis.incr(`${this.counterPrefix}${variable}`)
        afterIncrement = Number(afterIncrement)
        if (afterIncrement === 1) {
            await this.redis.expire(`${this.counterPrefix}${variable}`, ttl)
        }
        return afterIncrement
    }

    async getCounterValue (variable) {
        const key = `${this.counterPrefix}${variable}`
        return await this.redis.get(key)
    }

    async checkCounterExistence (variable) {
        const key = `${this.counterPrefix}${variable}`
        return await this.redis.exists(key)
    }

    async checkCountersExistence (...variables) {
        const keys = variables.map((variable) => `${this.counterPrefix}${variable}`)
        const counters = await Promise.all(keys.map(key => this.redis.del(key)))
        return counters.reduce((acc, currentValue) => acc + currentValue, 0)
    }

    async deleteCounter (variable) {
        const key = `${this.counterPrefix}${variable}`
        await this.redis.del(key)
    }

    async deleteCounters (...variables) {
        const keys = variables.map((variable) => `${this.counterPrefix}${variable}`)
        await Promise.all(keys.map(key => this.redis.del(key)))
    }

    // Counter
    // 1. Set variable to redis with TTL
    // 2. Check if counter exists
    // 3. Get counter remain time
    async counterTimeRemain (variable) {
        const time = await this.redis.ttl(`${this.counterPrefix}${variable}`)
        // -1: no ttl on variable, -2: key not exists
        return Math.max(time, 0)
    }

    // Lock
    // 1. Set variable to redis with TTL
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

    async unlock (variable, action = '') {
        const actionFolder = action ? `${action}:` : ''
        await this.redis.del(`${this.lockPrefix}${actionFolder}${variable}`)
    }
}

module.exports = {
    RedisGuard,
}
