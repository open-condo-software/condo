const { generateUUIDv4 } = require('@open-condo/miniapp-utils/helpers/uuid')

const { getKVClient } = require('./kv')

const DEFAULT_SETTINGS = Object.freeze({
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 50,
    lockDuration: 30_000,
})

class Lock {
    constructor (key, client) {
        this._key = key
        this._client = client
    }

    async release () {
        const result = await this._client.del(this._key)
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
        const result = await this._client.set(key, value, 'PX', duration, 'NX')

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
                return new Lock(kvKey, this._client)
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