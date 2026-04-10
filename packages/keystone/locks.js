const { generateUUIDv4 } = require('@open-condo/miniapp-utils/helpers/uuid')

const { getKVClient } = require('./kv')

const DEFAULT_SETTINGS = Object.freeze({
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 50,
    lockDuration: 30_000, // use negatives for infinite lock at your own risk
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

class Lock {
    constructor (key, client, value) {
        this._key = key
        this._client = client
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

class KVLock {
    constructor (settings) {
        this._client = getKVClient()
        this._settings = {
            ...DEFAULT_SETTINGS,
            ...settings,
        }
    }

    async _attemptAcquireLock (key, value, duration) {
        const result = duration > 0
            ? await this._client.set(key, value, 'PX', duration, 'NX')
            : await this._client.set(key, value, 'NX')

        return Boolean(result)
    }

    async acquire (key) {
        const maxAttempts = this._settings.retryCount === -1 ? Infinity : this._settings.retryCount
        const value = generateUUIDv4()

        let attempts = 0
        const kvKey = `lock:${key}`

        while (attempts < maxAttempts) {
            const acquired = await this._attemptAcquireLock(kvKey, value, this._settings.lockDuration)
            if (acquired) {
                return new Lock(kvKey, this._client, value)
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
    KVLock,
}