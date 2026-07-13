const get = require('lodash/get')

const { getKVClient } = require('@open-condo/keystone/kv')

/**
 * Document CRUD for tables routed to a `kv` provider pool in `DATABASE_POOLS`.
 *
 * Storage: Redis key `{SchemaName}:<id>` → JSON row.
 * Reads: `id`, `id_in`, optional `deletedAt: null`.
 */
class KvDataProvider {
    /**
     * Build a cluster-safe key for object storage.
     * `{<schemaName>}` is a Redis hash tag, so all keys of one schema land in one slot
     * and native `mget` works on cluster without patching the client API.
     */
    _getObjectKey (schemaName, id) {
        return `{${schemaName}}:${id}`
    }

    _getKv () {
        return getKVClient('cross-db')
    }

    matchFind ({ condition = {} } = {}) {
        return Boolean(this._resolveFindByIdQuery(condition))
    }

    async find ({ schemaName, condition = {} } = {}) {
        const findQuery = this._resolveFindByIdQuery(condition)
        if (!findQuery) {
            throw new Error(
                `KV source for ${schemaName} supports only { id }, { id_in }, and optional deletedAt: null filters`,
            )
        }
        if (findQuery.ids.length === 0) return []

        const kv = this._getKv()
        const keys = findQuery.ids.map(id => this._getObjectKey(schemaName, id))
        const rawValues = await kv.mget(keys)
        const objects = rawValues
            .filter(Boolean)
            .map((value) => {
                try {
                    return JSON.parse(value)
                } catch (err) {
                    throw new Error(`Invalid JSON in KV object for ${schemaName}`)
                }
            })

        if (!findQuery.requireDeletedAtNull) return objects
        return objects.filter(item => get(item, 'deletedAt', null) === null)
    }

    async create ({ schemaName, data }) {
        if (!data?.id) {
            throw new Error(`KV create for ${schemaName} requires data.id`)
        }

        const kv = this._getKv()
        const key = this._getObjectKey(schemaName, data.id)
        const wasCreated = await kv.set(key, JSON.stringify(data), 'NX')
        if (wasCreated !== 'OK') {
            throw new Error(`KV object already exists for ${schemaName} id ${data.id}`)
        }

        return data
    }

    async update ({ schemaName, id, data }) {
        if (!id) {
            throw new Error(`KV update for ${schemaName} requires id`)
        }

        const kv = this._getKv()
        const key = this._getObjectKey(schemaName, id)
        const maxAttempts = 5

        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            await kv.watch(key)
            const existingRaw = await kv.get(key)
            if (!existingRaw) {
                await kv.unwatch()
                throw new Error(`KV object not found for ${schemaName} id ${id}`)
            }

            let existing
            try {
                existing = JSON.parse(existingRaw)
            } catch (err) {
                await kv.unwatch()
                throw new Error(`Invalid JSON in KV object for ${schemaName}`)
            }

            const merged = { ...existing, ...data, id }
            const tx = kv.multi()
            tx.set(key, JSON.stringify(merged))
            const execResult = await tx.exec()
            if (execResult) {
                return merged
            }
        }

        throw new Error(`KV update conflict for ${schemaName} id ${id}`)
    }

    /** Soft-delete: sets `deletedAt` on the stored document. */
    async delete ({ schemaName, id }) {
        const deletedAt = new Date().toISOString()
        return this.update({ schemaName, id, data: { deletedAt } })
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
    KvDataProvider,
}
