const { getIdentifierType } = require('@condo/domains/user/utils/identifiers')

class AbstractResetter {
    supportedIdentifiers = []

    constructor (supportedIdentifiers) {
        this.supportedIdentifiers = supportedIdentifiers
    }

    isValidIdentifier (identifier) {
        const identifierType = getIdentifierType(identifier)
        const isValid = this.supportedIdentifiers.includes(identifierType)

        return { isValid, identifierType }
    }

    async checkExistence (identifier) {
        return Promise.resolve(true)
    }

    async reset (identifier) {
        return Promise.resolve(0)
    }
}

module.exports = {
    AbstractResetter,
}