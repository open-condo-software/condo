const { DV_UNKNOWN_VERSION_ERROR } = require('@condo/domains/common/constants/errors')

const defaultValidationError = (error) => console.warn('ValidationError for entity OrganizationEmployee', error)
module.exports = {
    validate (current, resolved, addValidationError = defaultValidationError) {
        const version = resolved.version
        switch (version) {
            case 1:
                break
            default:
                return addValidationError(`${DV_UNKNOWN_VERSION_ERROR}dv] Unknown \`dv\``)
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