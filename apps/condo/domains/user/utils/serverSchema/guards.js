const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const cloneDeep = require('lodash/cloneDeep')

const { GQLError } = require('@open-condo/keystone/errors')
const { getRedisClient } = require('@open-condo/keystone/redis')

const { GQL_ERRORS } = require('@condo/domains/user/constants/errors')

dayjs.extend(utc)

class RedisGuard {
    get redis () {
        if (!this._redis) this._redis = getRedisClient('guards')
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
            throw new GQLError({
                ...GQL_ERRORS.TOO_MANY_REQUESTS,
                messageInterpolation: {
                    secondsRemaining,
                },
            }, context)
        }
    }

    /**
     *
     * @param {string} variable
     * @param {number} windowSize
     * @param {number} counterLimit
     * @param {Object | undefined} context - Keystone context
     * @return {Promise<void>}
     */
    async checkCustomLimitCounters (variable, windowSize, counterLimit, context) {
        const expiryAnchorDate = dayjs().add(windowSize, 'second')
        const counter = await this.incrementCustomCounter(variable, expiryAnchorDate)
        if (counter > counterLimit) {
            const secondsRemaining = await this.counterTimeRemain(variable)
            throw new GQLError({
                ...GQL_ERRORS.TOO_MANY_REQUESTS,
                messageInterpolation: {
                    secondsRemaining,
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

        const multiIncr = this.redis.multi()
        for (const { key } of _countersData) {
            multiIncr.incr(`${this.counterPrefix}${key}`)
        }
        /**
         * @type {Array<[error: *, result: *]>}
         */
        const counters = await multiIncr.exec()

        const multiExpireat = this.redis.multi()
        for (let i = 0; i < _countersData.length; i++) {
            const error = counters[i][0]
            if (error) throw new Error(error)

            const guard = _countersData[i]
            const counter = counters[i][1]

            // if variable not exists - it will be set to 1
            if (counter === 1) {
                const expiryAnchorDate = dayjs().add(guard.windowSizeInSec, 'second')
                multiExpireat.expireat(`${this.counterPrefix}${guard.key}`, parseInt(`${expiryAnchorDate / 1000}`))
            }

            guard.isBlocked = counter > guard.windowLimit
            if (guard.isBlocked) {
                guard.secondsRemaining = await this.counterTimeRemain(guard.key)
            }
        }
        await multiExpireat.exec()

        const isBlocked = _countersData.some(guard => guard.isBlocked)

        const maxSecondsRemaining = Math.max(..._countersData.map(guard => guard?.secondsRemaining ?? 0))

        if (isBlocked) {
            throw new GQLError({
                ...GQL_ERRORS.TOO_MANY_REQUESTS,
                messageInterpolation: {
                    secondsRemaining: maxSecondsRemaining,
                },
            }, context)
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
        return await this.redis.exists(...keys)
    }

    async deleteCounter (variable) {
        const key = `${this.counterPrefix}${variable}`
        await this.redis.del(key)
    }

    async deleteCounters (...variables) {
        const keys = variables.map((variable) => `${this.counterPrefix}${variable}`)
        await this.redis.del(...keys)
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
