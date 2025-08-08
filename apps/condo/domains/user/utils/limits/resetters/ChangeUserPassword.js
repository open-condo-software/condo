const { IPv4_TYPE } = require('@condo/domains/user/constants/identifiers')
const { CHANGE_USER_PASSWORD_TYPE } = require('@condo/domains/user/constants/limits')

const { RedisGuardResetter } = require('./RedisGuardResetter')


class ChangeUserPassword extends RedisGuardResetter {
    constructor () {
        super(CHANGE_USER_PASSWORD_TYPE, [IPv4_TYPE])
    }

    #getKeys (identifierType, identifier) {
        const keys = []
        if (identifierType === IPv4_TYPE) {
            keys.push([CHANGE_USER_PASSWORD_TYPE, 'daily', 'ip', identifier].join(':'))
            keys.push([CHANGE_USER_PASSWORD_TYPE, 'hourly', 'ip', identifier].join(':'))
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
    ChangeUserPassword,
}
