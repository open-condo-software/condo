/**
 * Generated by `createschema meter.Meter 'number:Text; billingAccountMeter?:Relationship:BillingAccountMeter:SET_NULL; organization:Relationship:Organization:CASCADE; property:Relationship:Property:CASCADE; unitName:Text; place?:Text; resource:Relationship:MeterResource:CASCADE;'`
 */

const { get, isString } = require('lodash')

const conf = require('@open-condo/config')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema, find, getByCondition, getById } = require('@open-condo/keystone/schema')

const { UNIT_TYPE_FIELD } = require('@condo/domains/common/schema/fields')
const access = require('@condo/domains/meter/access/Meter')
const { METER_READING_MAX_VALUES_COUNT } = require('@condo/domains/meter/constants/constants')
const {
    B2B_APP_NOT_CONNECTED,
    B2C_APP_NOT_AVAILABLE,
    METER_NUMBER_HAVE_INVALID_VALUE,
    METER_ACCOUNT_NUMBER_HAVE_INVALID_VALUE,
    METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION,
    SAME_NUMBER_AND_RESOURCE_EXISTS_IN_ORGANIZATION,
    SAME_ACCOUNT_NUMBER_EXISTS_IN_OTHER_UNIT,
} = require('@condo/domains/meter/constants/errors')
const { deleteReadingsOfDeletedMeter } = require('@condo/domains/meter/tasks')
const { Meter: MeterApi, MeterResourceOwner } = require('@condo/domains/meter/utils/serverSchema')
const { ORGANIZATION_OWNED_FIELD } = require('@condo/domains/organization/schema/fields')
const { Property } = require('@condo/domains/property/utils/serverSchema')

const { resolveNumberOfTariffs, installationDate, commissioningDate, verificationDate, nextVerificationDate, controlReadingsDate, sealingDate, isAutomatic, resource, b2bApp, archiveDate } = require('./fields')

const ADDRESS_SERVICE_ENABLED = get(conf, 'ADDRESS_SERVICE_URL', false)

const ERRORS = {
    NUMBER_HAVE_INVALID_VALUE: {
        code: BAD_USER_INPUT,
        type: METER_NUMBER_HAVE_INVALID_VALUE,
        message: 'value of "number" field must be non-empty string',
        messageForUser: 'api.meter.meter.METER_NUMBER_HAVE_INVALID_VALUE',
        variable: ['data', 'number'],
    },
    ACCOUNT_NUMBER_HAVE_INVALID_VALUE: {
        code: BAD_USER_INPUT,
        type: METER_ACCOUNT_NUMBER_HAVE_INVALID_VALUE,
        message: 'value of "accountNumber" field must be non-empty string',
        messageForUser: 'api.meter.meter.METER_ACCOUNT_NUMBER_HAVE_INVALID_VALUE',
        variable: ['data', 'accountNumber'],
    },
    METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION: {
        code: BAD_USER_INPUT,
        type: METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION,
        message: 'Provided meter resource belongs to another organization',
        messageForUser: 'api.meter.meter.METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION',
        variable: ['data', 'resource'],
    },
    SAME_NUMBER_AND_RESOURCE_EXISTS_IN_ORGANIZATION: {
        code: BAD_USER_INPUT,
        type: SAME_NUMBER_AND_RESOURCE_EXISTS_IN_ORGANIZATION,
        message: 'Meter with same number and resource exist in current organization and linked with other account number',
        messageForUser: 'api.meter.meter.SAME_NUMBER_AND_RESOURCE_EXISTS_IN_ORGANIZATION',
    },
    SAME_ACCOUNT_NUMBER_EXISTS_IN_OTHER_UNIT: {
        code: BAD_USER_INPUT,
        type: SAME_ACCOUNT_NUMBER_EXISTS_IN_OTHER_UNIT,
        message: 'Meter with same account number exist in current organization in other unit',
        messageForUser: 'api.meter.meter.SAME_ACCOUNT_NUMBER_EXISTS_IN_OTHER_UNIT',
    },
}

// TODO(DOMA-6195): replace 'addFieldValidationError' and 'addValidationError' to 'GQLError'
const Meter = new GQLListSchema('Meter', {
    schemaDoc: 'Resource meter at a certain place in the unitName',
    fields: {
        organization: ORGANIZATION_OWNED_FIELD,
        numberOfTariffs: resolveNumberOfTariffs(METER_READING_MAX_VALUES_COUNT),
        installationDate,
        commissioningDate,
        verificationDate,
        nextVerificationDate,
        controlReadingsDate,
        sealingDate,
        archiveDate,
        isAutomatic,
        resource,
        b2bApp,

        property: {
            schemaDoc: 'Link to property which contains unit with this meter',
            type: 'Relationship',
            ref: 'Property',
            isRequired: true,
            knexOptions: { isNotNullable: true }, // Required relationship only!
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },
        number: {
            schemaDoc: 'Number of resource meter, such as "А03 9908"',
            type: 'Text',
            isRequired: true,
            hooks: {
                resolveInput: async ({ resolvedData, fieldPath }) => {
                    const value = resolvedData[fieldPath]
                    return isString(value) ? value.trim() : value
                },
                validateInput: async ({ context, operation, existingItem, resolvedData, fieldPath }) => {
                    const value = resolvedData[fieldPath]

                    if (!isString(value) || value.length < 1) {
                        throw new GQLError(ERRORS.NUMBER_HAVE_INVALID_VALUE, context)
                    }

                    // should be unique inside organization
                    let metersWithSameResourceAndNumberInOrganization
                    if (operation === 'create') {
                        metersWithSameResourceAndNumberInOrganization = await find('Meter', {
                            number: value,
                            organization: { id: resolvedData.organization },
                            resource: { id: resolvedData.resource },
                            deletedAt: null,
                        })
                    } else if (operation === 'update' && resolvedData.number !== existingItem.number) {
                        const organization = resolvedData.organization ? resolvedData.organization : existingItem.organization
                        const resource = resolvedData.resource ? resolvedData.resource : existingItem.resource

                        metersWithSameResourceAndNumberInOrganization = await MeterApi.getAll(context, {
                            number: value,
                            organization: { id: organization },
                            resource: { id: resource },
                            deletedAt: null,
                        }, 'accountNumber')
                    }

                    if (metersWithSameResourceAndNumberInOrganization && metersWithSameResourceAndNumberInOrganization.length > 0) {
                        throw new GQLError({
                            ...ERRORS.SAME_NUMBER_AND_RESOURCE_EXISTS_IN_ORGANIZATION,
                            messageInterpolation: { accountNumbersCsv: metersWithSameResourceAndNumberInOrganization.map(({ accountNumber }) => accountNumber).join(', ') },
                        }, context,
                        )
                    }
                },
            },
        },

        accountNumber: {
            schemaDoc: 'Client\'s billing account',
            type: 'Text',
            isRequired: true,
            hooks: {
                resolveInput: async ({ resolvedData, fieldPath }) => {
                    const value = resolvedData[fieldPath]
                    return isString(value) ? value.trim() : value
                },
                validateInput: async ({ context, operation, existingItem, resolvedData, fieldPath }) => {
                    const value = resolvedData[fieldPath]

                    if (!isString(value) || value.length < 1) {
                        throw new GQLError(ERRORS.ACCOUNT_NUMBER_HAVE_INVALID_VALUE, context)
                    }

                    if (operation === 'create' || (operation === 'update' && resolvedData.accountNumber !== existingItem.accountNumber)) {
                        const newItem = { ...existingItem, ...resolvedData }

                        const metersWithSameAccountNumberInOtherUnit = await MeterApi.getAll(context, {
                            accountNumber: value,
                            organization: { id: newItem.organization },
                            deletedAt: null,
                            OR: [
                                { unitName_not: newItem.unitName },
                                { unitType_not: newItem.unitType },
                                { property: { id_not: newItem.property } },
                            ],
                        }, 'unitType unitName')

                        if (metersWithSameAccountNumberInOtherUnit && metersWithSameAccountNumberInOtherUnit.length > 0) {
                            throw new GQLError({
                                ...ERRORS.SAME_ACCOUNT_NUMBER_EXISTS_IN_OTHER_UNIT,
                                messageInterpolation: { unitsCsv: metersWithSameAccountNumberInOtherUnit.map((meter) => `${meter.unitType} ${meter.unitName}`).join(', ') },
                            }, context
                            )
                        }
                    }
                },
            },
        },
        unitName: {
            schemaDoc: 'Unit with this meter',
            type: 'Text',
            isRequired: true,
        },
        unitType: {
            ...UNIT_TYPE_FIELD,
            isRequired: true,
        },
        place: {
            schemaDoc: 'Certain place in unit where meter is, such as kitchen',
            type: 'Text',
        },
        meta: {
            schemaDoc: 'Meter metadata. Can be used to store additional settings from external sources, such as billing integrations or mini apps',
            type: 'Json',
            isRequired: false,
        },
        b2cApp: {
            schemaDoc: 'Ref to the B2CApp which used to replace default integration with meter by resident\'s user in resident\'s app',
            type: 'Relationship',
            ref: 'B2CApp',
            isRequired: false,
            knexOptions: { isNotNullable: false }, // Relationship only!
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
        },
    },
    kmigratorOptions: {
        constraints: [
            {
                type: 'models.UniqueConstraint',
                fields: ['organization', 'number', 'resource'],
                condition: 'Q(deletedAt__isnull=True)',
                name: 'meter_unique_organization_and_number',
            },
        ],
    },
    hooks: {
        validateInput: async ({ resolvedData, addValidationError, existingItem, context, operation }) => {
            const newItem = { ...existingItem, ...resolvedData }

            if (resolvedData['b2bApp']) {
                const activeContext = await getByCondition('B2BAppContext', {
                    organization: { id: newItem.organization, deletedAt: null },
                    app: { id: newItem.b2bApp, deletedAt: null },
                    deletedAt: null,
                })
                if (!activeContext) {
                    return addValidationError(B2B_APP_NOT_CONNECTED)
                }
            }
            if (resolvedData['b2cApp']) {
                const property = await getById('Property', newItem.property)
                const address = get(property, 'address', null)
                const appProperty = await getByCondition('B2CAppProperty', {
                    deletedAt: null,
                    app: { id: newItem.b2cApp, deletedAt: null },
                    address_i: address,
                })
                if (!appProperty) {
                    return addValidationError(B2C_APP_NOT_AVAILABLE)
                }
            }

            const oldDeletedAt = get(existingItem, 'deletedAt')
            const newDeletedAt = get(resolvedData, 'deletedAt')
            const isSoftDeleteOperation = newDeletedAt && !oldDeletedAt

            const isNeedToCheckOwnership = operation === 'create' || (operation === 'update'
                && !isSoftDeleteOperation
                && (resolvedData['resource'] !== existingItem['resource'] || resolvedData['property'] !== existingItem['property'])
            )

            if (isNeedToCheckOwnership) {
                const property = await Property.getOne(context, {
                    id: newItem.property,
                    deletedAt: null,
                }, 'id address addressKey')
                if (property) {
                    const meterResourceOwner = await MeterResourceOwner.getOne(context, {
                        addressKey: property.addressKey,
                        resource: { id: newItem.resource },
                        deletedAt: null,
                    }, 'organization { id }')

                    if (meterResourceOwner && meterResourceOwner.organization.id !== newItem.organization) {
                        throw new GQLError(ERRORS.METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION, context)
                    }

                }
            }
        },
        afterChange: async ({ context, operation, originalInput, updatedItem }) => {
            const property = await Property.getOne(context, {
                id: updatedItem.property,
                deletedAt: null,
            }, 'id address addressKey')

            if (property) {
                const hasMeterResourceOwnership = await MeterResourceOwner.getOne(context, {
                    addressKey: property.addressKey,
                    resource: { id: updatedItem.resource },
                    deletedAt: null,
                })

                if (!originalInput['deletedAt'] && !hasMeterResourceOwnership) {
                    // TODO(DOMA-8836): remove environment dependency when address service will run in production mode in tests
                    let address = property.addressKey ? `key:${property.addressKey}` : property.address
                    if (!ADDRESS_SERVICE_ENABLED) {
                        address = property.address
                    }

                    await MeterResourceOwner.create(context, {
                        dv: 1, sender: originalInput.sender,
                        address,
                        organization: { connect: { id: updatedItem.organization } },
                        resource: { connect: { id: updatedItem.resource } },
                    })
                }
            }

            if (operation === 'update') {
                const deletedMeterAt = get(originalInput, 'deletedAt')

                if (deletedMeterAt) {
                    await deleteReadingsOfDeletedMeter.delay(updatedItem, deletedMeterAt)
                }
            }
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical()],
    access: {
        read: access.canReadMeters,
        create: access.canManageMeters,
        update: access.canManageMeters,
        delete: false,
        auth: true,
    },
})

module.exports = {
    Meter,
    METER_ERRORS: ERRORS,
}
