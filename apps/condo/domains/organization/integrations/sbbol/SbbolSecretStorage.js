const conf = require('@condo/config')
const { getRedisClient } = require('@condo/keystone/redis')

const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}

// All keys belonging to SBBOL integration will have this prefix in their names
const SBBOL_REDIS_KEY_PREFIX = 'SBBOL'

class SbbolSecretStorage {

    // Redis client instance to store values
    #keyStorage

    // SBBOL has many APIs. Instance of this storage is associated for specified API to prevent collisions with other
    #apiName

    // Identifier of our integration (contour) in SBBOL
    #clientId

    constructor (apiName, clientId) {
        this.#keyStorage = getRedisClient('sbbol')
        this.#clientId = clientId
        this.#apiName = apiName
    }

    get clientId () {
        return this.#clientId
    }

    get clientSecret () {
        // When no clientSecret has been stored yet, return a seeded one
        return this.#getValue('clientSecret') || SBBOL_AUTH_CONFIG.client_secret
    }

    setClientSecret (value, ttl) {
        this.#setValue('clientSecret', value, ttl)
    }

    get accessToken () {
        return this.#getValue('accessToken')
    }

    async setAccessToken (value, ttl) {
        await this.#setValue('accessToken', value, ttl)
    }

    get isAccessTokenExpired () {
        return this.#keyStorage.ttl(this.#scopedKey('accessToken')) <= 0
    }

    get refreshToken () {
        return this.#getValue('refreshToken')
    }

    async setRefreshToken (value, ttl) {
        await this.#setValue('refreshToken', value, ttl)
    }

    get isRefreshTokenExpired () {
        return this.#keyStorage.ttl(this.#scopedKey('refreshToken')) <= 0
    }

    #getValue (key) {
        return this.#keyStorage.get(this.#scopedKey(key))
    }

    #setValue (key, value, ttl) {
        if (ttl) {
            this.#keyStorage.set(this.#scopedKey(key), value, 'EX', ttl)
        } else {
            this.#keyStorage.set(this.#scopedKey(key), value)
        }
    }

    #scopedKey (key) {
        return [SBBOL_REDIS_KEY_PREFIX, this.#apiName, this.#clientId, key].join(':')
    }
}

module.exports = {
    SbbolSecretStorage,
}