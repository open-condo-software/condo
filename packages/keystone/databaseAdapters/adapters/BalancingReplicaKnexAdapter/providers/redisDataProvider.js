const get = require('lodash/get')

const { getKVClient } = require('@open-condo/keystone/kv')

const { BaseDataProvider } = require('./baseDataProvider')

class RedisDataProvider extends BaseDataProvider {
    supportsFind ({ condition = {} } = {}) {
        return Boolean(this._resolveFindByIdQuery(condition))
    }

    async find ({ schemaName, condition = {} } = {}) {
        const findQuery = this._resolveFindByIdQuery(condition)
        if (!findQuery) {
            throw new Error(
                `Redis source for ${schemaName} supports only { id }, { id_in }, and optional deletedAt: null filters`
            )
        }
        if (findQuery.ids.length === 0) return []

        const kv = getKVClient('cross-db-find')
        const keys = findQuery.ids.map(id => `${schemaName}:${id}`)
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

        if (!findQuery.requireDeletedAtNull) return objects
        return objects.filter(item => get(item, 'deletedAt', null) === null)
    }

    _resolveFindByIdQuery (condition = {}) {
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
