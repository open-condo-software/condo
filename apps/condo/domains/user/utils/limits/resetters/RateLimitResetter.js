const { getKVClient } = require('@open-condo/keystone/kv')
const { ApolloRateLimitingPlugin } = require('@open-condo/keystone/rateLimiting')

const { UUID_TYPE, IPv4_TYPE } = require('@condo/domains/user/constants/identifiers')

const { AbstractResetter } = require('./AbstractResetter')


class RateLimitResetter extends AbstractResetter {
    constructor () {
        super([UUID_TYPE, IPv4_TYPE])
        this.redis = getKVClient()
    }

    #getKey (identifierType, identifier) {
        const identityPrefix = identifierType === UUID_TYPE ? 'user' : 'ip'
        return ApolloRateLimitingPlugin.buildQuotaKey(identityPrefix, identifier)
    }

    async checkExistence (identifier) {
        const { isValid, identifierType } = this.isValidIdentifier(identifier)
        if (!isValid) {
            return false
        }

        const key = this.#getKey(identifierType, identifier)

        return await this.redis.exists(key)
    }

    async reset (identifier) {
        const { isValid, identifierType } = this.isValidIdentifier(identifier)
        if (!isValid) {
            return 0
        }

        const key = this.#getKey(identifierType, identifier)

        return await this.redis.del(key)
    }
}

module.exports = {
    RateLimitResetter,
}
