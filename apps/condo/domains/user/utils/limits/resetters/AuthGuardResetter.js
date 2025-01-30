const { EMAIL_TYPE, PHONE_TYPE, UUID_TYPE, IPv4_TYPE } = require('@condo/domains/user/constants/identifiers')
const { AUTH_COUNTER_LIMIT_TYPE } = require('@condo/domains/user/constants/limits')

const { RedisGuardResetter } = require('./RedisGuardResetter')


class AuthGuardResetter extends RedisGuardResetter {
    constructor () {
        super(AUTH_COUNTER_LIMIT_TYPE, [IPv4_TYPE, UUID_TYPE, PHONE_TYPE, EMAIL_TYPE])
    }

    #getKeys (identifierType, identifier) {
        const keys = []
        if (identifierType === IPv4_TYPE) {
            keys.push([AUTH_COUNTER_LIMIT_TYPE, 'ip', identifier].join(':'))
        } else if (identifierType === UUID_TYPE) {
            keys.push([AUTH_COUNTER_LIMIT_TYPE, 'user', identifier].join(':'))
        } else if (identifierType === PHONE_TYPE) {
            keys.push([AUTH_COUNTER_LIMIT_TYPE, 'phone-and-user-type', 'staff', identifier].join(':'))
            keys.push([AUTH_COUNTER_LIMIT_TYPE, 'phone-and-user-type', 'resident', identifier].join(':'))
            keys.push([AUTH_COUNTER_LIMIT_TYPE, 'phone-and-user-type', 'service', identifier].join(':'))
        } else if (identifierType === EMAIL_TYPE) {
            keys.push([AUTH_COUNTER_LIMIT_TYPE, 'email-and-user-type', 'staff', identifier].join(':'))
            keys.push([AUTH_COUNTER_LIMIT_TYPE, 'email-and-user-type', 'resident', identifier].join(':'))
            keys.push([AUTH_COUNTER_LIMIT_TYPE, 'email-and-user-type', 'service', identifier].join(':'))
        }
        return keys
    }

    async checkExistence (identifier) {
        const { isValid, identifierType } = this.isValidIdentifier(identifier)
        if (!isValid) {
            return false
        }

        // NOTE: identifierKey = userId | phone | email | ip
        const keys = this.#getKeys(identifierType, identifier)

        const listOfLimits = []
        for (const key of keys) {
            listOfLimits.push(await this.guard.checkCounterExistence(key))
        }

        return listOfLimits.length > 0 && listOfLimits.some((hasLimit) => hasLimit)
    }

    async reset (identifier) {
        const { isValid, identifierType } = this.isValidIdentifier(identifier)
        if (!isValid) {
            return 0
        }

        // NOTE: identifierKey = userId | phone | email | ip
        const keys = this.#getKeys(identifierType, identifier)

        for (const key of keys) {
            await this.guard.deleteCounter(key)
        }
    }
}

module.exports = {
    AuthGuardResetter,
}
