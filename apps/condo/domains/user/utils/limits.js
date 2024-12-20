const { ApolloRateLimitingPlugin } = require('@open-condo/keystone/rateLimiting')
const { getRedisClient } = require('@open-condo/keystone/redis')

const { IPv4_TYPE, PHONE_TYPE, UUID_TYPE } = require('@condo/domains/user/constants/identifiers')
const { AUTH_COUNTER_LIMIT_TYPE } = require('@condo/domains/user/constants/limits')
const { getIdentifierType } = require('@condo/domains/user/utils/identifiers')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

class AuthLimitResetter {
    supportedIdentifiers = [IPv4_TYPE, PHONE_TYPE]

    constructor () {
        this.guard = new RedisGuard()
    }

    async checkExistence (identifier) {
        const identifierType = getIdentifierType(identifier)
        if (!this.supportedIdentifiers.includes(identifierType)) {
            return false
        }

        return await this.guard.checkCounterExistence(`${AUTH_COUNTER_LIMIT_TYPE}:${identifier}`)
    }

    async reset (identifier) {
        const identifierType = getIdentifierType(identifier)
        if (!this.supportedIdentifiers.includes(identifierType)) {
            return false
        }

        return await this.guard.deleteCounter(`${AUTH_COUNTER_LIMIT_TYPE}:${identifier}`)
    }
}

class RateLimitResetter {
    supportedIdentifiers = [UUID_TYPE, IPv4_TYPE]

    constructor () {
        this.redis = getRedisClient()
    }

    async checkExistence (identifier) {
        const identifierType = getIdentifierType(identifier)
        if (!this.supportedIdentifiers.includes(identifierType)) {
            return false
        }

        const identityPrefix = identifierType === UUID_TYPE ? 'user' : 'ip'
        const key = ApolloRateLimitingPlugin.buildQuotaKey(identityPrefix, identifierType)

        return await this.redis.exists(key)
    }

    async reset (identifier) {
        const identifierType = getIdentifierType(identifier)
        if (!this.supportedIdentifiers.includes(identifierType)) {
            return false
        }

        const identityPrefix = identifierType === UUID_TYPE ? 'user' : 'ip'
        const key = ApolloRateLimitingPlugin.buildQuotaKey(identityPrefix, identifierType)

        return await this.redis.del(key)
    }
}

module.exports = {
    AuthLimitResetter,
    RateLimitResetter,
}