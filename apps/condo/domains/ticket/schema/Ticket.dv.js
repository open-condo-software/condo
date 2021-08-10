const { STATUS_UPDATED_AT_ERROR, DV_UNKNOWN_VERSION_ERROR } = require('@condo/domains/common/constants/errors')

const defaultValidationError = (error) => console.warn('ValidationError for entity Ticket', error)
module.exports = {
    validate (current, resolved, addValidationError = defaultValidationError) {
        const version = resolved.version
        switch (version) {
            case 1:
                // NOTE: version 1 specific translations. Don't optimize this logic
                if (resolved.statusUpdatedAt) {
                    if (current.statusUpdatedAt) {
                        if (new Date(resolved.statusUpdatedAt) <= new Date(current.statusUpdatedAt)) {
                            return addValidationError(`${STATUS_UPDATED_AT_ERROR}statusUpdatedAt] Incorrect \`statusUpdatedAt\``)
                        }
                    } else {
                        if (new Date(resolved.statusUpdatedAt) <= new Date(current.createdAt)) {
                            return addValidationError(`${STATUS_UPDATED_AT_ERROR}statusUpdatedAt] Incorrect \`statusUpdatedAt\``)
                        }
                    }
                }
                break
		
            default:
                break
        }
    },
    upgrade (data, resolved, addValidationError = defaultValidationError) {
        const currentVersion = data.dv
        const newVersion = resolved.dv
        if (currentVersion === newVersion) return
        switch (newVersion) {
            default:
                return addValidationError(`${DV_UNKNOWN_VERSION_ERROR}dv] Unknown \`dv\``)
        }
    },
}