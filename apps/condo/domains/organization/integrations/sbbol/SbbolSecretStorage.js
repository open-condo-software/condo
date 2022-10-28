const dayjs = require('dayjs')
const conf = require('@condo/config')
const { getRedisClient } = require('@condo/keystone/redis')

const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}

// All keys belonging to SBBOL integration will have this prefix in their names
const SBBOL_REDIS_KEY_PREFIX = 'SBBOL'

// Real TTL is 180 days, but we need to update it earlier
const REFRESH_TOKEN_TTL_DAYS = 30

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
        this.keyStorage = getRedisClient('sbbol')
        this.clientId = clientId
        this.apiName = apiName
    }

    async getClientSecret () {
        // When no clientSecret has been stored yet, return a seeded one
        return this.getValue('clientSecret') || SBBOL_AUTH_CONFIG.client_secret
    }

    async setClientSecret (value, options) {
        await this.setValue('clientSecret', value, options)
        await this.setValue('clientSecret:updatedAt', dayjs().toISOString())
    }

    async getAccessToken () {
        return this.getValue('accessToken')
    }

    async setAccessToken (value, options) {
        await this.setValue('accessToken', value, options)
        await this.setValue('accessToken:updatedAt', dayjs().toISOString())
    }

    async isAccessTokenExpired () {
        return await this.isExpired('accessToken')
    }

    async getRefreshToken () {
        return this.getValue('refreshToken')
    }

    async setRefreshToken (value) {
        const options = { expiresAt: dayjs().add(REFRESH_TOKEN_TTL_DAYS, 'days').unix() }
        await this.setValue('refreshToken', value, options)
        await this.setValue('refreshToken:updatedAt', dayjs().toISOString())
    }

    async isRefreshTokenExpired () {
        return await this.isExpired('refreshToken')
    }

    async setOrganization (id) {
        await this.setValue('organization', id)
    }

    getValue (key) {
        const scopedKey = this.scopedKey(key)
        return this.keyStorage.get(scopedKey)
    }

    async setValue (key, value, options = {}) {
        const { ttl, expiresAt } = options
        const commands = this.keyStorage.multi()
        commands.set(this.scopedKey(key), value)
        if (ttl) {
            commands.expire(this.scopedKey(key), ttl)
        }
        if (expiresAt) {
            commands.expireat(this.scopedKey(key), expiresAt)
        }
        await commands.exec()
    }

    async isExpired (key) {
        // NOTE: `TTL` Redis command returns -2 if the key does not exist, -1 if the key exists but has no associated expire
        return !this.keyStorage.ttl(this.scopedKey(key)) > 0
    }

    scopedKey (key) {
        return [SBBOL_REDIS_KEY_PREFIX, this.apiName, this.clientId, key].join(':')
    }
}

module.exports = {
    SbbolSecretStorage,
}