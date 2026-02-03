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
        for (const [fieldName, field] of Object.entries(fields)) {
            if (typeof field !== 'object' || Object.hasOwn(field, 'sensitive')) continue

            if (field?.type === 'EncryptedText') {
                field.sensitive = true
            }

            if (SENSITIVE_FIELDS_REGEXPS.some(regexp => regexp.test(fieldName))) {
                field.sensitive = true
            }
        }

        return {
            fields,
            ...rest,
            analytical: true,
        }
    })
}

module.exports = {
    analytical,
}