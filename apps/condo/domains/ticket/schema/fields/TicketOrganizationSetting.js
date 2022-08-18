const { Integer } = require('@keystonejs/fields')
const { get, isNull } = require('lodash')
const { WRONG_VALUE } = require('@condo/domains/common/constants/errors')
const {
    DEFAULT_TICKET_DEADLINE,
    MAX_TICKET_DEADLINE,
    MIN_TICKET_DEADLINE,
    TICKET_DEFAULT_DEADLINE_FIELDS,
} = require('@condo/domains/ticket/constants/common')

const SCHEMA_DOC_FOR_DEFAULT_DEADLINE_FIELDS = {
    'defaultDeadline': 'Default deadline for any tickets',
    'paidDeadline': 'Default deadline for paid tickets',
    'emergencyDeadline': 'Default deadline for emergency tickets',
    'warrantyDeadline': 'Default deadline for warranty tickets',
}

function generateDefaultDeadlineField (fieldPath, schemaDoc) {
    if (!fieldPath) throw new Error('no fieldPath')
    if (!schemaDoc) throw new Error('no schemaDoc')

    return {
        schemaDoc,
        type: Integer,
        defaultValue: DEFAULT_TICKET_DEADLINE,
        kmigratorOptions: { null: true },
        hooks: {
            validateInput: async ({ existingItem, resolvedData, addFieldValidationError, fieldPath }) => {
                const newItem = { ...existingItem, ...resolvedData }
                const defaultDeadline = get(newItem, fieldPath, null)
                if (!isNull(defaultDeadline)) {
                    if (Number(defaultDeadline) < MIN_TICKET_DEADLINE || Number(defaultDeadline) > MAX_TICKET_DEADLINE) {
                        return addFieldValidationError(`${WRONG_VALUE} the value of the "${fieldPath}" field must be between values from ${MIN_TICKET_DEADLINE} to ${MAX_TICKET_DEADLINE} inclusive`)
                    }
                }
            },
        },
    }
}

function getSchemaDocForDefaultDeadlineField (fieldName) {
    if (!fieldName) throw new Error('no fieldName')
    if (!(fieldName in SCHEMA_DOC_FOR_DEFAULT_DEADLINE_FIELDS)) throw new Error(`no SchemaDoc for ${fieldName}`)

    return SCHEMA_DOC_FOR_DEFAULT_DEADLINE_FIELDS[fieldName]
}

function generateTicketDefaultDeadlineFields () {
    return TICKET_DEFAULT_DEADLINE_FIELDS.reduce((result, fieldName) => ({
        ...result,
        [fieldName]: generateDefaultDeadlineField(fieldName, getSchemaDocForDefaultDeadlineField(fieldName)),
    }), {})
}

module.exports = {
    generateTicketDefaultDeadlineFields,
}
