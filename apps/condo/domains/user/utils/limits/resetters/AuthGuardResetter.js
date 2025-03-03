const { STAFF, SERVICE, RESIDENT } = require('@condo/domains/user/constants/common')
const { EMAIL_TYPE, PHONE_TYPE, UUID_TYPE, IPv4_TYPE } = require('@condo/domains/user/constants/identifiers')
const { AUTH_COUNTER_LIMIT_TYPE } = require('@condo/domains/user/constants/limits')
const { buildQuotaKey, buildQuotaKeyByUserType } = require('@condo/domains/user/utils/serverSchema/auth')

const { RedisGuardResetter } = require('./RedisGuardResetter')


class AuthGuardResetter extends RedisGuardResetter {
    constructor () {
        super(AUTH_COUNTER_LIMIT_TYPE, [IPv4_TYPE, UUID_TYPE, PHONE_TYPE, EMAIL_TYPE])
    }

    #getKeys (identifierType, identifier) {
        const keys = []
        if (identifierType === IPv4_TYPE) {
            keys.push(buildQuotaKey('ip', identifier))
        } else if (identifierType === UUID_TYPE) {
            keys.push(buildQuotaKey('user', identifier))
        } else if (identifierType === PHONE_TYPE) {
            keys.push(buildQuotaKeyByUserType('phone', identifier, STAFF))
            keys.push(buildQuotaKeyByUserType('phone', identifier, RESIDENT))
            keys.push(buildQuotaKeyByUserType('phone', identifier, SERVICE))
        } else if (identifierType === EMAIL_TYPE) {
            keys.push(buildQuotaKeyByUserType('email', identifier, STAFF))
            keys.push(buildQuotaKeyByUserType('email', identifier, RESIDENT))
            keys.push(buildQuotaKeyByUserType('email', identifier, SERVICE))
        }
        return keys
    }

    async checkExistence (identifier) {
        const { isValid, identifierType } = this.isValidIdentifier(identifier)
        if (!isValid) {
            return false
        }

        // NOTE: identifierType = userId | phone | email | ip
        return await this.guard.checkCountersExistence(...this.#getKeys(identifierType, identifier))
    }

    async reset (identifier) {
        const { isValid, identifierType } = this.isValidIdentifier(identifier)
        if (!isValid) {
            return 0
        }

        // NOTE: identifierType = userId | phone | email | ip
        return await this.guard.deleteCounters(...this.#getKeys(identifierType, identifier))
    }
}

module.exports = {
    AuthGuardResetter,
}
