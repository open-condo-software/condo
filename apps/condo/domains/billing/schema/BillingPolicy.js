const get = require('lodash/get')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { historical, versioned, uuided, tracked, softDeleted, dvAndSender, analytical } = require('@open-condo/keystone/plugins')
const { GQLListSchema, getById } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/billing/access/BillingPolicy')
const {
    BILLING_CYCLES,
    BILLING_CYCLE_MONTHLY,
    PARTIAL_MONTH_RULE_FULL,
    PARTIAL_MONTH_RULES,
} = require('@condo/domains/billing/constants/rent')
const { ORGANIZATION_OWNED_FIELD } = require('@condo/domains/organization/schema/fields')

const ERRORS = {
    SCOPE_MISMATCH: {
        code: BAD_USER_INPUT,
        type: 'BILLING_POLICY_SCOPE_MISMATCH',
        message: 'Billing policy property must belong to the same organization',
        messageForUser: 'api.billing.billingPolicy.SCOPE_MISMATCH',
    },
}

const BillingPolicy = new GQLListSchema('BillingPolicy', {
    schemaDoc: 'Rent billing policy for a property',
    fields: {
        organization: ORGANIZATION_OWNED_FIELD,

        property: {
            schemaDoc: 'Property this billing policy applies to',
            type: 'Relationship',
            ref: 'Property',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },

        billingCycle: {
            schemaDoc: 'Billing cycle for rent charges',
            type: 'Select',
            options: BILLING_CYCLES,
            dataType: 'string',
            isRequired: true,
            defaultValue: BILLING_CYCLE_MONTHLY,
            kmigratorOptions: { null: false, default: `'${BILLING_CYCLE_MONTHLY}'` },
        },

        dueDay: {
            schemaDoc: 'Day of month rent is due',
            type: 'Integer',
            isRequired: true,
            defaultValue: 1,
            kmigratorOptions: { null: false, default: 1 },
        },

        gracePeriod: {
            schemaDoc: 'Number of days after due date before late handling starts',
            type: 'Integer',
            isRequired: true,
            defaultValue: 0,
            kmigratorOptions: { null: false, default: 0 },
        },

        partialMonthRule: {
            schemaDoc: 'How partial occupancy months are charged',
            type: 'Select',
            options: PARTIAL_MONTH_RULES,
            dataType: 'string',
            isRequired: true,
            defaultValue: PARTIAL_MONTH_RULE_FULL,
            kmigratorOptions: { null: false, default: `'${PARTIAL_MONTH_RULE_FULL}'` },
        },

        lateFeePolicy: {
            schemaDoc: 'Late fee policy metadata',
            type: 'Json',
            isRequired: false,
        },
    },
    hooks: {
        validateInput: async ({ resolvedData, existingItem, context }) => {
            const item = { ...existingItem, ...resolvedData }
            const propertyId = get(item, 'property')
            const organizationId = get(item, 'organization')

            if (propertyId && organizationId) {
                const property = await getById('Property', propertyId)

                if (property && property.organization !== organizationId) {
                    throw new GQLError(ERRORS.SCOPE_MISMATCH, context)
                }
            }
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical(), analytical()],
    access: {
        read: access.canReadBillingPolicies,
        create: access.canManageBillingPolicies,
        update: access.canManageBillingPolicies,
        delete: false,
        auth: true,
    },
})

module.exports = {
    BillingPolicy,
}
