const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

const { AbstractResetter } = require('./AbstractResetter')

class RedisGuardResetter extends AbstractResetter {
    guard_prefix = ''

    constructor (prefix, supportedIdentifiers) {
        super(supportedIdentifiers)
        this.guard = new RedisGuard()
        this.guard_prefix = prefix
    }

    async checkExistence (identifier) {
        const { isValid } = this.isValidIdentifier(identifier)
        if (!isValid) {
            return false
        }

        return await this.guard.checkCounterExistence(`${this.guard_prefix}:${identifier}`)
    }

    async reset (identifier) {
        const { isValid } = this.isValidIdentifier(identifier)
        if (!isValid) {
            return 0
        }

        return await this.guard.deleteCounter(`${this.guard_prefix}:${identifier}`)
    }
}

module.exports = {
    RedisGuardResetter,
}