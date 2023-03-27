const dayjs = require('dayjs')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')

const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}

// All keys belonging to SBBOL integration will have this prefix in their names
const SBBOL_REDIS_KEY_PREFIX = 'SBBOL'

// Real TTL is 180 days, but it is updated every time the accessToken expires and we get a new pair
const REFRESH_TOKEN_TTL_DAYS = 180
const ACCESS_TOKEN_TTL_SEC = 3550

const logger = getLogger('sbbol/SbbolSecretStorage')

/**
 * Replaces `TokenSet` schema for storage of secrets for SBBOL API
 */
class SbbolSecretStorage {
    /**
     *
     * @param apiName - SBBOL has many APIs. Instance of this storage is associated for specified API to prevent collisions with other
     * @param clientId - Identifier of our integration (contour) in SBBOL
     */
    constructor (apiName, clientId) {
        if (!apiName) throw new Error('SbbolSecretStorage: no apiName')
        if (!clientId) throw new Error('SbbolSecretStorage: no clientId')
        this.keyStorage = getRedisClient()
        this.clientId = clientId
        this.apiName = apiName
    }

    async getClientSecret () {
        // When no clientSecret has been stored yet, return a seeded one
        return await this.#getValue('clientSecret') || SBBOL_AUTH_CONFIG.client_secret
    }

    async setClientSecret (value, options) {
        await this.#setValue('clientSecret', value, options)
        await this.#setValue('clientSecret:updatedAt', dayjs().toISOString())
    }

    async getAccessToken (userId) {
        if (!userId) throw new Error('userId is required for setAccessToken')
        const key = `user:${userId}:accessToken`
        return {
            accessToken: await this.#getValue(key),
            ttl: await this.keyStorage.ttl(this.#scopedKey(key)),
        }
    }

    async setAccessToken (
        value,
        userId,
        options,
    ) {
        if (!value) throw new Error('value is required for setAccessToken')
        if (!userId) throw new Error('userId is required for setAccessToken')

        await this.#setValue(`user:${userId}:accessToken`, value, { expiresAt: dayjs().add(ACCESS_TOKEN_TTL_SEC, 's').unix(), ...options })
        await this.#setValue(`user:${userId}:accessToken:updatedAt`, dayjs().toISOString())
    }

    async isAccessTokenExpired (userId) {
        return await this.#isExpired(`user:${userId}:accessToken`)
    }

    async getRefreshToken (userId) {
        return this.#getValue(`user:${userId}:refreshToken`)
    }

    async setRefreshToken (
        value,
        userId,
    ) {
        if (!value) throw new Error('value is required for setRefreshToken')
        if (!userId) throw new Error('userId is required for setRefreshToken')

        const options = { expiresAt: dayjs().add(REFRESH_TOKEN_TTL_DAYS, 'days').unix() }
        await this.#setValue(`user:${userId}:refreshToken`, value, options)
        await this.#setValue(`user:${userId}:refreshToken:updatedAt`, dayjs().toISOString())
    }

    async isRefreshTokenExpired (userId) {
        return await this.#isExpired(`user:${userId}:refreshToken`)
    }

    async setOrganization (id) {
        await this.#setValue('organization', id)
    }

    /**
     * Used for inspection of stored values in case when there is no direct access to Redis
     */
    async getRawKeyValues (userId) {
        if (!userId) throw new Error('userId is required for getRawKeyValues')

        const organization = this.#scopedKey('organization')
        const clientSecretScopedKey = this.#scopedKey('clientSecret')
        const accessTokenScopedKey = this.#scopedKey(`user:${userId}:accessToken`)
        const refreshTokenScopedKey = this.#scopedKey(`user:${userId}:refreshToken`)

        const organizationValue = await this.#getValue('organization')
        const clientSecretValue = await this.#getValue('clientSecret')
        const accessTokenValue = await this.#getValue(`user:${userId}:accessToken`)
        const refreshTokenValue = await this.#getValue(`user:${userId}:refreshToken`)

        return {
            [organization]: organizationValue,
            [clientSecretScopedKey]: clientSecretValue,
            [accessTokenScopedKey]: accessTokenValue,
            [refreshTokenScopedKey]: refreshTokenValue,
        }
    }

    #getValue (key) {
        const scopedKey = this.#scopedKey(key)
        return this.keyStorage.get(scopedKey)
    }

    async #setValue (key, value, options = {}) {
        const { ttl, expiresAt } = options
        const commands = this.keyStorage.multi()
        const scopedKey = this.#scopedKey(key)
        commands.set(scopedKey, value)
        if (ttl) {
            commands.expire(scopedKey, ttl)
        }
        if (expiresAt) {
            commands.expireat(scopedKey, expiresAt)
        }
        return commands.exec()
            .then(() => {
                logger.info({ msg: `Set ${scopedKey}`, value })
            }).catch(() => {
                logger.error({ msg: `Error set ${scopedKey}`, value })
            })
    }

    async #isExpired (key) {
        // NOTE: `TTL` Redis command returns -2 if the key does not exist, -1 if the key exists but has no associated expire
        return (await this.keyStorage.ttl(this.#scopedKey(key))) <= 0
    }

    #scopedKey (key) {
        return [SBBOL_REDIS_KEY_PREFIX, this.apiName, this.clientId, key].join(':')
    }
}

module.exports = {
    SbbolSecretStorage,
}
