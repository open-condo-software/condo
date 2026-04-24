const { plugin } = require('./utils/typing')

const SENSITIVE_FIELDS_REGEXPS = [
    /phone/i,
    /email/i,
    /password/i,
    /secret/i,
    /token/i,
    /settings/i,
    /state/i,
]

function analytical () {
    return plugin(({ fields = {}, ...rest }) => {

        const modifiedFields = Object.fromEntries(Object.entries(fields).map(([fieldName, field]) => {
            if (typeof field !== 'object' || Object.hasOwn(field, 'sensitive')) return [fieldName, field]

            if (field?.type === 'EncryptedText' || SENSITIVE_FIELDS_REGEXPS.some(regexp => regexp.test(fieldName))) {
                // NOTE: need to copy object to avoid mutation
                return [fieldName, { ...field, sensitive: true }]
            }

            return [fieldName, field]
        }))

        return {
            fields: modifiedFields,
            ...rest,
            analytical: true,
        }
    })
}

module.exports = {
    analytical,
}