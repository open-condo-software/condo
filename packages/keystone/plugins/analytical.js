const { plugin } = require('./utils/typing')

const SENSITIVE_FIELDS = new Set([
    'phone',
    'email',
    'password',
    'secret',
    'token',
    'settings',
    'state',

])

function analytical () {
    return plugin(({ fields = {}, ...rest }) => {
        for (const [fieldName, field] of Object.entries(fields)) {
            if (typeof field !== 'object' || Object.hasOwn(field, 'sensitive')) continue

            if (field?.type === 'EncryptedText') {
                field.sensitive = true
            }

            if (SENSITIVE_FIELDS.has(fieldName)) {
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