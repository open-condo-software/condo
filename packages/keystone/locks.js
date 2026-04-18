const { generateUUIDv4 } = require('@open-condo/miniapp-utils/helpers/uuid')

const { getKVClient } = require('./kv')

// NOTE: taken from https://github.com/mike-marcacci/node-redlock/blob/afe5cf92c8247ba7b65b4ae36230f415493c44f0/src/index.ts#L106
const DEFAULT_SETTINGS = Object.freeze({
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 100,
    lockDuration: 30_000, // NOTE: negatives can be used for infinite lock at your own risk
})

// Lua script for atomic check-and-delete
// Only deletes the key if the value matches (prevents deleting another process's lock)
// KEYS[1] = lock key
// ARGV[1] = expected value (token)
// Returns 1 if deleted, 0 if not found or value mismatch
// NOTE: prevents cases, when original release is called after lock is expired and taken by another process
const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
`

class KVLock {
    constructor (client, kvKey, value) {
        this._client = client
        this._key = kvKey
        this._value = value
    }

    async release () {
        const result = await this._client.eval(RELEASE_SCRIPT, 1, this._key, this._value)
        return Boolean(result)
    }
}

class LockAcquisitionError extends Error {
    constructor (message) {
        super(message)
        this.name = 'LockAcquisitionError'
    }
}

class KVLocker {
    constructor (settings) {
        // NOTE: force explicitly specified lock duration
        if (typeof settings?.lockDuration !== 'number') {
            throw new Error('lockDuration must be specified')
        }
        this._client = getKVClient()
        this._settings = {
            ...DEFAULT_SETTINGS,
            ...settings,
        }
    }

    async #attemptAcquireLock (key, value, duration) {
        const result = duration > 0
            ? await this._client.set(key, value, 'PX', duration, 'NX')
            : await this._client.set(key, value, 'NX')

        return Boolean(result)
    }

    #getKVKey (key) {
        return `lock:${key}`
    }

    async acquire (key) {
        const maxAttempts = this._settings.retryCount === -1 ? Infinity : this._settings.retryCount + 1
        const value = generateUUIDv4()

        let attempts = 0
        const kvKey = this.#getKVKey(key)

        while (attempts < maxAttempts) {
            const acquired = await this.#attemptAcquireLock(kvKey, value, this._settings.lockDuration)
            if (acquired) {
                return new KVLock(this._client, kvKey, value)
            }
            attempts += 1

            if (attempts >= maxAttempts) {
                throw new LockAcquisitionError('Failed to acquire lock after maximum attempts')
            }

            const jitter = (Math.random() * 2 - 1) * this._settings.retryJitter
            const delay = Math.max(0, this._settings.retryDelay + jitter)
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }
}

module.exports = {
    KVLocker,
    LockAcquisitionError,
}