const { PHONE_TYPE, IPv4_TYPE } = require('@condo/domains/user/constants/identifiers')
const { CHECK_USER_EXISTENCE_TYPE } = require('@condo/domains/user/constants/limits')

const { RedisGuardResetter } = require('./RedisGuardResetter')


class CheckUserExistenceResetter extends RedisGuardResetter {
    constructor () {
        super(CHECK_USER_EXISTENCE_TYPE, [IPv4_TYPE, PHONE_TYPE])
    }

    async checkExistence (identifier) {
        const { isValid, identifierType } = this.isValidIdentifier(identifier)
        if (!isValid) {
            return false
        }

        const fullIdentifier = [identifierType === IPv4_TYPE ? 'ip' : 'phone', identifier].join(':')
        return await this.guard.checkCounterExistence(`${this.guard_prefix}:${fullIdentifier}`)
    }

    async reset (identifier) {
        const { isValid, identifierType } = this.isValidIdentifier(identifier)
        if (!isValid) {
            return 0
        }

        const fullIdentifier = [identifierType === IPv4_TYPE ? 'ip' : 'phone', identifier].join(':')
        return await this.guard.deleteCounter(`${this.guard_prefix}:${fullIdentifier}`)
    }
}


module.exports = {
    CheckUserExistenceResetter,
}
