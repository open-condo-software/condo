const get = require('lodash/get')

const { getKVClient } = require('@open-condo/keystone/kv')

class RedisDataProvider {
    shouldHandleFind ({ condition = {} } = {}) {
        return Boolean(this._resolveFindQuery(condition))
    }

    async executeFind ({ schemaName, condition = {} } = {}) {
        const redisQuery = this._resolveFindQuery(condition)
        if (!redisQuery) {
            throw new Error(`Redis source for ${schemaName} supports only { id }, { id_in }, and optional deletedAt: null filters`)
        }
        if (redisQuery.ids.length === 0) return []

        const kv = getKVClient('cross-db-find')
        const keys = redisQuery.ids.map(id => `${schemaName}:${id}`)
        const rawValues = await kv.mget(keys)
        const objects = rawValues
            .filter(Boolean)
            .map((value) => {
                try {
                    return JSON.parse(value)
                } catch (err) {
                    throw new Error(`Invalid JSON in redis object for ${schemaName}`)
                }
            })

        if (!redisQuery.requireDeletedAtNull) return objects
        return objects.filter(item => get(item, 'deletedAt', null) === null)
    }

    shouldHandleItemsQuery () {
        return false
    }

    async executeItemsQuery () {
        return null
    }

    shouldHandleCreate () {
        return false
    }

    async executeCreate () {
        return null
    }

    shouldHandleUpdate () {
        return false
    }

    async executeUpdate () {
        return null
    }

    shouldHandleDelete () {
        return false
    }

    async executeDelete () {
        return null
    }

    _resolveFindQuery (condition = {}) {
        const keys = Object.keys(condition || {})
        const allowedKeys = new Set(['id', 'id_in', 'deletedAt'])
        if (keys.some(key => !allowedKeys.has(key))) return null

        const hasDeletedAtFilter = Reflect.has(condition, 'deletedAt')
        if (hasDeletedAtFilter && condition.deletedAt !== null) return null

        if (condition.id) {
            return { ids: [condition.id], requireDeletedAtNull: hasDeletedAtFilter }
        }
        if (Array.isArray(condition.id_in)) {
            return { ids: condition.id_in.filter(Boolean), requireDeletedAtNull: hasDeletedAtFilter }
        }
        return null
    }
}

module.exports = {
    RedisDataProvider,
}
