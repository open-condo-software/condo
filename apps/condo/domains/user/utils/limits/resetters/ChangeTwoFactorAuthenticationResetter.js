const { IPv4_TYPE, UUID_TYPE } = require('@condo/domains/user/constants/identifiers')
const { CHANGE_TWO_FACTOR_AUTHENTICATION_TYPE } = require('@condo/domains/user/constants/limits')

const { RedisGuardResetter } = require('./RedisGuardResetter')


class ChangeTwoFactorAuthentication extends RedisGuardResetter {
    constructor () {
        super(CHANGE_TWO_FACTOR_AUTHENTICATION_TYPE, [IPv4_TYPE, UUID_TYPE])
    }

    #getKeys (identifierType, identifier) {
        const keys = []
        if (identifierType === IPv4_TYPE) {
            keys.push([CHANGE_TWO_FACTOR_AUTHENTICATION_TYPE, 'daily', 'ip', identifier].join(':'))
        }
        if (identifierType === UUID_TYPE) {
            keys.push([CHANGE_TWO_FACTOR_AUTHENTICATION_TYPE, 'daily', 'userId', identifier].join(':'))
        }

        return keys
    }

    async checkExistence (identifier) {
        const { isValid, identifierType } = this.isValidIdentifier(identifier)

        if (!isValid) {
            return false
        }

        return await this.guard.checkCountersExistence(...this.#getKeys(identifierType, identifier))
    }

    async reset (identifier) {
        const { isValid, identifierType } = this.isValidIdentifier(identifier)
        if (!isValid) {
            return 0
        }

        return await this.guard.deleteCounters(...this.#getKeys(identifierType, identifier))
    }
}

module.exports = {
    ChangeTwoFactorAuthentication,
}
