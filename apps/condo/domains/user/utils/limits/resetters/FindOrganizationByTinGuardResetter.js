const { EMAIL_TYPE, PHONE_TYPE, UUID_TYPE } = require('@condo/domains/user/constants/identifiers')
const { FIND_ORGANIZATION_BY_TIN_TYPE } = require('@condo/domains/user/constants/limits')

const { RedisGuardResetter } = require('./RedisGuardResetter')


class FindOrganizationByTinGuardResetter extends RedisGuardResetter {
    constructor () {
        super(FIND_ORGANIZATION_BY_TIN_TYPE, [EMAIL_TYPE, PHONE_TYPE, UUID_TYPE])
    }

    #getKeys (identifierKey, identifier) {
        return [
            `${this.guard_prefix}:${identifierKey}:${identifier}`,
            `${this.guard_prefix}:total:${identifierKey}:${identifier}`,
        ]
    }

    async checkExistence (identifier) {
        const { isValid, identifierType } = this.isValidIdentifier(identifier)
        if (!isValid) {
            return false
        }

        // NOTE: identifierKey = userId | phone | email
        const identifierKey = identifierType === UUID_TYPE ? 'userId' : identifierType

        return this.guard.checkCountersExistence(...this.#getKeys(identifierKey, identifier))
    }

    async reset (identifier) {
        const { isValid, identifierType } = this.isValidIdentifier(identifier)
        if (!isValid) {
            return 0
        }

        // NOTE: identifierKey = userId | phone | email
        const identifierKey = identifierType === UUID_TYPE ? 'userId' : identifierType

        return await this.guard.deleteCounters(...this.#getKeys(identifierKey, identifier))
    }
}

module.exports = {
    FindOrganizationByTinGuardResetter,
}
