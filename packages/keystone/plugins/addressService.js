const get = require('lodash/get')

const {
    createInstance: createAddressServiceClientInstance,
} = require('@open-condo/clients/address-service-client')
const { getLogger } = require('@open-condo/keystone/logging')
const { composeResolveInputHook } = require('@open-condo/keystone/plugins/utils')
const { ADDRESS_META_FIELD } = require('@open-condo/keystone/plugins/utils/addressMetaDefinition')
const { plugin } = require('@open-condo/keystone/plugins/utils/typing')

const logger = getLogger('address-service-plugin')

const readOnlyAccess = {
    read: true,
    create: false,
    update: false,
    delete: false,
}

const getFieldsToAdd = (fieldsHooks) => ({
    address: {
        schemaDoc: 'Normalized address',
        type: 'Text',
        isRequired: true,
        hooks: {
            ...(fieldsHooks['address'] || {}),
        },
    },
    addressKey: {
        type: 'Text',
        schemaDoc: 'The unique key of the address',
        access: readOnlyAccess,
        hooks: {
            ...(fieldsHooks['addressKey'] || {}),
        },
    },
    addressMeta: ADDRESS_META_FIELD,
    addressSources: {
        type: 'Json',
        schemaDoc: 'The origins of the address (some strings which may looks like real address or some id)',
        access: readOnlyAccess,
        hooks: {
            ...(fieldsHooks['addressSources'] || {}),
        },
    },
})

/**
 * Plugin to extend address field with address service
 * @param {Object} fieldsHooks
 * @param resolveAddressFields
 */
const addressService = ({
    fieldsHooks = {},
    resolveAddressFields = ({ addressFields }) => addressFields,
} = {}) => plugin(({
    fields = {},
    hooks = {},
    ...rest
}, schemaObj) => {
    //
    // Modify fields
    //
    const fieldsToAdd = getFieldsToAdd(fieldsHooks)

    // Check fields before adding new ones
    Object.keys(fieldsToAdd).forEach((fieldNameToAdd) => {
        if (fields[fieldNameToAdd]) {
            throw new Error(`Plugin \`addressService\` can not add field \`${fieldNameToAdd}\` to \`${schemaObj.schemaName}\`, because this field already defined`)
        }
    })

    //
    // Modify hooks
    //
    const newResolveInput = async ({ resolvedData, operation, existingItem, originalInput, context, listKey }) => {
        const addressFields = {}
        const existingAddressSources = get(existingItem, 'addressSources', [])
        // We will call to address service in the following cases:
        if (
            // In the case of new property/resident creation
            (operation === 'create')

            // In some update cases...
            || (
                operation === 'update'
                // When we do not try to delete
                && !resolvedData['deletedAt']
                && (
                    // ... When existing item has no address key (a database row was created before the address service was launched)
                    !existingItem['addressKey']

                    || (
                        // ... When the received address is not included in address sources for existing property/resident model
                        // We suppose that the received `address` field is a source of an actual address.
                        // The value of the received `address` field may equal some address string or some UUID or something else.
                        // The actual address will be received from the address service.
                        !!resolvedData['address']
                        && !existingAddressSources.includes(resolvedData['address'])
                        // But! If we edit a building (change name or square or year) created from injections we receive a string in the `address` field.
                        // This string is not equals 'injectionId:<uuid>', but equals human-readable address string (value got from InjectionSeeker)
                        // So, we also need to compare received `address` with existing address.
                        && resolvedData['address'] !== existingItem['address']
                    )
                )
            )
        ) {
            const client = createAddressServiceClientInstance({ ...existingItem, ...resolvedData })
            const addressToSearch = get({ ...existingItem, ...resolvedData }, 'address')

            const result = await client.search(addressToSearch)

            if (result) {
                const resultAddress = get(result, 'address')

                if (addressToSearch !== resultAddress) {
                    logger.warn({
                        msg: 'searched address does not match to the found address',
                        data: {
                            addressToSearch,
                            resultAddress,
                            operation,
                            listKey,
                            itemId: get(existingItem, 'id'),
                            addressKey: get(existingItem, 'addressKey'),
                        },
                    })
                }
                /**
                 * We have some restriction for updating some fields for existing resident
                 * @see apps/condo/domains/resident/schema/RegisterResidentService.js
                 * @see apps/condo/domains/resident/schema/Resident.js
                 */

                addressFields['address'] = resultAddress
                addressFields['addressMeta'] = {
                    dv: 1,
                    value: get(result, ['addressMeta', 'value'], ''),
                    unrestricted_value: get(result, ['addressMeta', 'unrestricted_value'], ''),
                    data: get(result, ['addressMeta', 'data'], null),
                }

                addressFields['addressKey'] = get(result, 'addressKey')
                addressFields['addressSources'] = get(result, 'addressSources', [])
            } else {
                logger.error({
                    msg: 'No address found by string',
                    data: {
                        addressToSearch,
                        operation,
                        listKey,
                        itemId: get(existingItem, 'id'),
                        addressKey: get(existingItem, 'addressKey'),
                    },
                })

                throw new Error(`No address found by string "${addressToSearch}"`)
            }
        } else {
            // NOTE(pahaz): if you don't need to change the address you want to prevent any changes
            delete resolvedData['address']
            delete resolvedData['addressMeta']
            delete resolvedData['addressKey']
            delete resolvedData['addressSources']
        }

        return { ...resolvedData, ...resolveAddressFields({ addressFields, operation }) }
    }
    hooks.resolveInput = composeResolveInputHook(hooks.resolveInput, newResolveInput)

    return { fields: { ...fields, ...fieldsToAdd }, hooks, ...rest }
})

module.exports = { addressService }
