const IORedis = require('ioredis')
const { isString, get } = require('lodash')

const conf = require('@core/config')

const REDIS_URL = conf['REDIS_URL']

class RedisVar {
    constructor (varName) {
        if (!varName || !isString(varName)) throw new Error('RedisVars varName value should be non-empty string')

        this.db = new IORedis(REDIS_URL)
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