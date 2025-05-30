/**
 * Generated by `createschema onboarding.UserHelpRequest 'type:Select:callback;importFile;organization:Relationship:Organization:CASCADE;phone:Text;file?:File;meta?:Json'`
 */
const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')

const { GQLError } = require('@open-condo/keystone/errors')
const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')
const { webHooked } = require('@open-condo/webhooks/plugins')

const { COMMON_ERRORS } = require('@condo/domains/common/constants/errors')
const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const access = require('@condo/domains/onboarding/access/UserHelpRequest')
const { USER_HELP_REQUEST_TYPES } = require('@condo/domains/onboarding/constants/userHelpRequest')
const { UserHelpRequestFile } = require('@condo/domains/onboarding/utils/serverSchema')
const { ORGANIZATION_OWNED_FIELD } = require('@condo/domains/organization/schema/fields')


const UserHelpRequest = new GQLListSchema('UserHelpRequest', {
    schemaDoc: 'Request from the user to help him with some functionality',
    fields: {
        type: {
            schemaDoc: 'Type of request. It\'s can be, for example, request for callback or request to help with import' +
                'or integration setup',
            type: 'Select',
            dataType: 'string',
            options: USER_HELP_REQUEST_TYPES,
            isRequired: true,
        },
        organization: ORGANIZATION_OWNED_FIELD,
        billingIntegration: {
            schemaDoc: 'ID of the billing integration that is configured to receive data for the organization',
            type: 'Relationship',
            ref: 'BillingIntegration',
            isRequired: false,
            knexOptions: { isNotNullable: false },
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
        },
        phone: {
            schemaDoc: 'Specified phone in request for callback',
            type: 'Text',
            isRequired: true,
            hooks: {
                resolveInput: ({ resolvedData, fieldPath }) => {
                    const newValue = resolvedData[fieldPath]

                    if (newValue) {
                        return normalizePhone(newValue) || newValue
                    }
                },
                validateInput: async ({ resolvedData, fieldPath, context }) => {
                    const newValue = resolvedData[fieldPath]

                    if (newValue && newValue !== normalizePhone(newValue)) {
                        throw new GQLError(COMMON_ERRORS.WRONG_PHONE_FORMAT, context)
                    }
                },
            },
        },
        email: {
            schemaDoc: 'Specified email in request for assisted setup of integration',
            type: 'Text',
            isRequired: false,
            hooks: {
                resolveInput: ({ resolvedData, fieldPath }) => {
                    const newValue = resolvedData[fieldPath]

                    if (newValue) {
                        return normalizeEmail(newValue) || newValue
                    }
                },

                validateInput: async ({ resolvedData, fieldPath, context }) => {
                    const newValue = resolvedData[fieldPath]

                    if (newValue && newValue !== normalizeEmail(newValue)) {
                        throw new GQLError(COMMON_ERRORS.WRONG_EMAIL_FORMAT, context)
                    }
                },
            },
        },
        isReadyToSend: {
            schemaDoc: 'Shows if the request is ready to send. False value can be, for example, if files are not synced with help request yet',
            type: 'Checkbox',
            defaultValue: true,
        },
        meta: {
            schemaDoc: 'Additional info about request. May contain information about file urls, page where user made request or import type',
            type: 'Json',
            hooks: {
                resolveInput: async ({ resolvedData, fieldPath, existingItem, context }) => {
                    if (!existingItem) return resolvedData[fieldPath]

                    const userHelpRequestId = existingItem.id
                    const files = await UserHelpRequestFile.getAll(
                        context,
                        { userHelpRequest: { id: userHelpRequestId } },
                        'file { publicUrl }'
                    )

                    if (!isEmpty(files)) {
                        const currentMeta = { ...get(existingItem, fieldPath, {}), ...get(resolvedData, fieldPath, {}) }
                        const urls = files.map(file => get(file, 'file.publicUrl')).filter(Boolean)

                        return { ...currentMeta, files: urls }
                    }

                    return resolvedData[fieldPath]
                },
            },
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical(), webHooked()],
    access: {
        read: access.canReadUserHelpRequests,
        create: access.canManageUserHelpRequests,
        update: access.canManageUserHelpRequests,
        delete: false,
        auth: true,
    },
})

module.exports = {
    UserHelpRequest,
}
