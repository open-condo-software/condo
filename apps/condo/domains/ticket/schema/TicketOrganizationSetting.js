const { Integer } = require('@keystonejs/fields')
const { GQLListSchema } = require('@condo/keystone/schema')
const { ORGANIZATION_OWNED_FIELD } = require('@condo/domains/organization/schema/fields')
const { get, isNull } = require('lodash')
const { WRONG_VALUE } = require('@condo/domains/common/constants/errors')
const { uuided, versioned, tracked, softDeleted, historical } = require('@condo/keystone/plugins')
const { dvAndSender } = require('@condo/domains/common/schema/plugins/dvAndSender')
const access = require('@condo/domains/ticket/access/TicketOrganizationSetting')

const MIN_DEADLINE = 0
const MAX_DEADLINE = 45
const DEFAULT_DEADLINE = 8

const TicketOrganizationSetting = new GQLListSchema('TicketOrganizationSetting', {
    schemaDoc: 'Ticket settings rules for each organization',
    fields: {
        organization: {
            ...ORGANIZATION_OWNED_FIELD,
            kmigratorOptions: {
                ...ORGANIZATION_OWNED_FIELD.kmigratorOptions,
                unique: true,
            },
        },
        defaultDeadline: {
            schemaDoc: 'Default deadline for any tickets',
            type: Integer,
            defaultValue: DEFAULT_DEADLINE,
            kmigratorOptions: { null: true },
            hooks: {
                validateInput: async ({ existingItem, resolvedData, addFieldValidationError }) => {
                    const newItem = { ...existingItem, ...resolvedData }
                    const defaultDeadline = get(newItem, 'defaultDeadline', null)
                    if (!isNull(defaultDeadline)) {
                        if (Number(defaultDeadline) < MIN_DEADLINE || Number(defaultDeadline) > MAX_DEADLINE) {
                            return addFieldValidationError(`${WRONG_VALUE} the value of the "defaultDeadline" field must be between values from ${MIN_DEADLINE} to ${MAX_DEADLINE} inclusive`)
                        }
                    }
                },
            },
        },
        paidDeadline: {
            schemaDoc: 'Default deadline for paid tickets',
            type: Integer,
            defaultValue: DEFAULT_DEADLINE,
            kmigratorOptions: { null: true },
            hooks: {
                validateInput: async (data) => {
                    const { existingItem, resolvedData, addFieldValidationError } = data
                    const newItem = { ...existingItem, ...resolvedData }
                    const defaultDeadline = get(newItem, 'paidDeadline', null)
                    if (!isNull(defaultDeadline)) {
                        if (Number(defaultDeadline) < MIN_DEADLINE || Number(defaultDeadline) > MAX_DEADLINE) {
                            return addFieldValidationError(`${WRONG_VALUE} the value of the "paidDeadline" field must be between values from ${MIN_DEADLINE} to ${MAX_DEADLINE} inclusive`)
                        }
                    }
                },
            },
        },
        emergencyDeadline: {
            schemaDoc: 'Default deadline for emergency tickets',
            type: Integer,
            defaultValue: DEFAULT_DEADLINE,
            kmigratorOptions: { null: true },
            hooks: {
                validateInput: async ({ existingItem, resolvedData, addFieldValidationError }) => {
                    const newItem = { ...existingItem, ...resolvedData }
                    const defaultDeadline = get(newItem, 'emergencyDeadline', null)
                    if (!isNull(defaultDeadline)) {
                        if (Number(defaultDeadline) < MIN_DEADLINE || Number(defaultDeadline) > MAX_DEADLINE) {
                            return addFieldValidationError(`${WRONG_VALUE} the value of the "emergencyDeadline" field must be between values from ${MIN_DEADLINE} to ${MAX_DEADLINE} inclusive`)
                        }
                    }
                },
            },
        },
        warrantyDeadline: {
            schemaDoc: 'Default deadline for warranty tickets',
            type: Integer,
            defaultValue: DEFAULT_DEADLINE,
            kmigratorOptions: { null: true },
            hooks: {
                validateInput: async ({ existingItem, resolvedData, addFieldValidationError }) => {
                    const newItem = { ...existingItem, ...resolvedData }
                    const defaultDeadline = get(newItem, 'warrantyDeadline', null)
                    if (!isNull(defaultDeadline)) {
                        if (Number(defaultDeadline) < MIN_DEADLINE || Number(defaultDeadline) > MAX_DEADLINE) {
                            return addFieldValidationError(`${WRONG_VALUE} the value of the "warrantyDeadline" field must be between values from ${MIN_DEADLINE} to ${MAX_DEADLINE} inclusive`)
                        }
                    }
                },
            },
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical()],
    access: {
        read: access.canReadTicketOrganizationSetting,
        create: false,
        update: access.canUpdateTicketOrganizationSetting,
        delete: false,
        auth: true,
    },
})

module.exports = {
    TicketOrganizationSetting,
}