const get = require('lodash/get')

const { getKVClient } = require('@open-condo/keystone/kv')

/**
 * Atomically GET → merge patch + id → SET.
 * KEYS[1] = object key
 * ARGV[1] = JSON patch object
 * ARGV[2] = id (always written onto the merged document)
 * Returns merged JSON string, or false when the key is missing.
 */
const UPDATE_SCRIPT = `
local raw = redis.call("GET", KEYS[1])
if not raw then
    return false
end
local existing = cjson.decode(raw)
local patch = cjson.decode(ARGV[1])
for k, v in pairs(patch) do
    existing[k] = v
end
existing["id"] = ARGV[2]
local merged = cjson.encode(existing)
redis.call("SET", KEYS[1], merged)
return merged
`

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

        let mergedRaw
        try {
            mergedRaw = await kv.eval(UPDATE_SCRIPT, 1, key, JSON.stringify(data || {}), String(id))
        } catch (err) {
            const message = String(err?.message || err)
            if (/cjson|invalid|json/i.test(message)) {
                throw new Error(`Invalid JSON in KV object for ${schemaName}`)
            }
            throw err
        }

        if (mergedRaw === false || mergedRaw == null) {
            throw new Error(`KV object not found for ${schemaName} id ${id}`)
        }

        try {
            return JSON.parse(mergedRaw)
        } catch (err) {
            throw new Error(`Invalid JSON in KV object for ${schemaName}`)
        }
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
