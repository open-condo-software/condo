const pickBy = require('lodash/pickBy')

const MAX_ERROR_FIELD_LENGTH = 100

function truncate (value) {
    if (typeof value !== 'string') return value
    if (value.length <= MAX_ERROR_FIELD_LENGTH) return value

    return `${value.slice(0, MAX_ERROR_FIELD_LENGTH - 3)}...`
}

// NOTE(YEgorLu): Native Error serializes as {}; keep full diagnostics in memory and bound JSON fields unless the provider defines toJSON.
class PushDeliveryError extends Error {
    constructor (error) {
        const originalError = error ?? new Error()
        super(originalError.message ?? '')
        this.name = originalError.name
        this.stack = originalError.stack
        this.code = originalError.code
        this.originalError = originalError
    }

    toJSON () {
        if (typeof this.originalError.toJSON === 'function') {
            return this.originalError.toJSON()
        }

        return pickBy({
            code: truncate(this.code),
            message: truncate(this.message),
            stack: truncate(this.stack),
        }, value => value !== undefined && value !== null && value !== '')
    }
}

module.exports = { PushDeliveryError }
