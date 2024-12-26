const { EMAIL_TYPE, PHONE_TYPE, UUID_TYPE } = require('@condo/domains/user/constants/identifiers')
const { FIND_ORGANIZATION_BY_TIN_TYPE } = require('@condo/domains/user/constants/limits')

const { RedisGuardResetter } = require('./RedisGuardResetter')


class FindOrganizationByTinGuardResetter extends RedisGuardResetter {
    constructor () {
        super(FIND_ORGANIZATION_BY_TIN_TYPE, [EMAIL_TYPE, PHONE_TYPE, UUID_TYPE])
    }

    async checkExistence (identifier) {
        const { isValid, identifierType } = this.isValidIdentifier(identifier)
        if (!isValid) {
            return false
        }

        // NOTE: identifierKey = userId | phone | email
        const identifierKey = identifierType === 'uuid' ? 'userId' : identifierType

        const hasDailyLimit = await this.guard.checkCounterExistence(`${this.guard_prefix}:${identifierKey}:${identifier}`)
        const hasTotalLimit = await this.guard.checkCounterExistence(`${this.guard_prefix}:total:${identifierKey}:${identifier}`)
        return hasDailyLimit || hasTotalLimit
    }

    async reset (identifier) {
        const { isValid, identifierType } = this.isValidIdentifier(identifier)
        if (!isValid) {
            return 0
        }

        // NOTE: typeKey = userId | phone | email
        const typeKey = identifierType === 'uuid' ? 'userId' : identifierType

        await this.guard.deleteCounter(`${this.guard_prefix}:${typeKey}:${identifier}`)
        await this.guard.deleteCounter(`${this.guard_prefix}:total:${typeKey}:${identifier}`)
    }
}

module.exports = {
    FindOrganizationByTinGuardResetter,
}
