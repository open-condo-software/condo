const { IPv4_TYPE, UUID_TYPE, EMAIL_TYPE } = require('@condo/domains/user/constants/identifiers')
const { CHANGE_OR_VERIFY_USER_EMAIL_TYPE } = require('@condo/domains/user/constants/limits')

const { RedisGuardResetter } = require('./RedisGuardResetter')


class ChangeOrVerifyUserEmail extends RedisGuardResetter {
    constructor () {
        super(CHANGE_OR_VERIFY_USER_EMAIL_TYPE, [IPv4_TYPE, UUID_TYPE, EMAIL_TYPE])
    }

    #getKeys (identifierType, identifier) {
        const keys = []
        if (identifierType === IPv4_TYPE) {
            keys.push([CHANGE_OR_VERIFY_USER_EMAIL_TYPE, 'daily', 'ip', identifier].join(':'))
        }
        if (identifierType === UUID_TYPE) {
            keys.push([CHANGE_OR_VERIFY_USER_EMAIL_TYPE, 'daily', 'userId', identifier].join(':'))
        }
        if (identifierType === EMAIL_TYPE) {
            keys.push([CHANGE_OR_VERIFY_USER_EMAIL_TYPE, 'daily', 'email', identifier].join(':'))
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
    ChangeOrVerifyUserEmail,
}
