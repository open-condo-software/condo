const { isString, get } = require('lodash')

const { getRedisClient } = require('@core/keystone/redis')


class RedisVar {
    constructor (varName) {
        if (!varName || !isString(varName)) throw new Error('RedisVars varName value should be non-empty string')

        this.db = getRedisClient('redis-var')
        this.varName = varName
    }

    async set (value) {
        await this.db.set(this.varName, JSON.stringify({ value }))
    }

    async get () {
        const value = await this.db.get(this.varName)

        return value && get(JSON.parse(value), 'value') || undefined
    }
}

module.exports = {
    RedisVar,
}