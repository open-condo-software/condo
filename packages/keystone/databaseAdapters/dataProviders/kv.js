const get = require('lodash/get')

const { createKVClientFromUrl, getKVClient } = require('@open-condo/keystone/kv')

const KV_CONNECTION_URL_HINT = 'redis:// or valkey:// URL'
const KV_PROTOCOLS = new Set(['redis', 'rediss', 'valkey', 'valkeys'])

function getConnectionProtocol (url) {
    const match = String(url || '').match(/^([a-z][a-z0-9+.-]*):\/\//i)
    return match ? match[1].toLowerCase() : null
}

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
     * @param {string|undefined|null} url
     * @returns {boolean}
     */
    static isConnectionUrl (url) {
        return KV_PROTOCOLS.has(getConnectionProtocol(url))
    }

    /**
     * @param {{
     *   getClient?: () => import('ioredis').Redis|import('ioredis').Cluster,
     *   connections?: Record<string, string>,
     * }} [options]
     *   `connections` are named `DATABASE_URL` entries listed on this pool.
     *   `getClient` is for tests. With neither, uses `getKVClient('cross-db')`.
     */
    constructor (options = {}) {
        this._getClient = options.getClient
        this._connections = options.connections || {}
        this._clients = []
        this._nextClient = 0
    }

    /**
     * Open ioredis clients for `connections`. No-op when the pool listed no databases.
     */
    async connect () {
        const entries = Object.entries(this._connections)
        if (!entries.length) return

        const clients = []
        for (const [dbName, url] of entries) {
            if (!KvDataProvider.isConnectionUrl(url)) {
                await Promise.all(clients.map(client => client.quit().catch(() => {})))
                throw new Error(`KV database "${dbName}" must use a ${KV_CONNECTION_URL_HINT}`)
            }
            const client = createKVClientFromUrl(url, { name: `database-url:${dbName}` })
            try {
                await client.ping()
                clients.push(client)
            } catch (err) {
                await client.quit().catch(() => {})
                await Promise.all(clients.map(existing => existing.quit().catch(() => {})))
                throw new Error(`Failed to connect to KV database "${dbName}": ${String(err)}`)
            }
        }
        this._clients = clients
        this._nextClient = 0
    }

    /** Close clients opened by {@link connect}. */
    async disconnect () {
        const clients = this._clients
        this._clients = []
        this._nextClient = 0
        await Promise.all(clients.map(client => client.quit().catch(() => {})))
    }
    /**
     * Build a cluster-safe key for object storage.
     * `{<schemaName>}` is a Redis hash tag, so all keys of one schema land in one slot
     * and native `mget` works on cluster without patching the client API.
     */
    _getObjectKey (schemaName, id) {
        return `{${schemaName}}:${id}`
    }

    _getKv () {
        const injected = typeof this._getClient === 'function' ? this._getClient() : null
        if (injected) return injected
        if (this._clients.length) {
            const client = this._clients[this._nextClient % this._clients.length]
            this._nextClient += 1
            return client
        }
        return getKVClient('cross-db')
    }

    matchFind ({ condition = {} } = {}) {
        return Boolean(this._resolveFindByIdQuery(condition))
    }

    /** Load documents by `{ id }`, `{ id_in }`, optional `deletedAt: null`. */
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

    /** SET NX `{SchemaName}:id` → JSON. Fails if the key already exists. */
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

    /** Merge `data` into the stored document (atomic Lua GET/SET). */
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

KvDataProvider.connectionUrlHint = KV_CONNECTION_URL_HINT

module.exports = {
    KvDataProvider,
}
