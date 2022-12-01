const conf = require('@open-condo/config')
const { ADDRESS_META_FIELD } = require('@open-condo/keystone/plugins/utils/addressMetaDefinition')
const { composeResolveInputHook } = require('@open-condo/keystone/plugins/utils')
const { plugin } = require('@open-condo/keystone/plugins/utils/typing')
const { Text } = require('@keystonejs/fields')
const { Json } = require('@open-condo/keystone/fields')
const {
    createInstance: createAddressServiceClientInstance,
    createTestInstance: createTestAddressServiceClientInstance,
} = require('@open-condo/keystone/plugins/utils/address-service-client')
const get = require('lodash/get')

const readOnlyAccess = {
    read: true,
    create: false,
    update: false,
    delete: false,
}

const getFieldsToAdd = (fieldsHooks) => ({
    address: {
        schemaDoc: 'Normalized address',
        type: Text,
        isRequired: true,
        hooks: {
            ...(fieldsHooks['address'] || {}),
        },
    },
    addressKey: {
        type: Text,
        schemaDoc: 'The unique key of the address',
        access: readOnlyAccess,
        hooks: {
            ...(fieldsHooks['addressKey'] || {}),
        },
    },
    addressMeta: ADDRESS_META_FIELD,
    addressSources: {
        type: Json,
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
 */
const addressService = (fieldsHooks = {}) => plugin(({
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
    const newResolveInput = async ({ resolvedData, operation, existingItem, originalInput, context }) => {
        const existingAddressSources = get(existingItem, 'addressSources', [])
        // We will call to address service in the following cases:
        if (
            // In the case of new property/resident creation
            (operation === 'create')

            // In some update cases...
            || (
                operation === 'update' && (
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
            // todo(AleX83Xpert) maybe create separated client for `conf.NODE_ENV === 'development'` mode
            const client = conf.NODE_ENV === 'test' || get(conf, 'ADDRESS_SERVICE_CLIENT_MODE') === 'fake'
                ? createTestAddressServiceClientInstance({ ...existingItem, ...resolvedData })
                : createAddressServiceClientInstance(get(conf, 'ADDRESS_SERVICE_URL'))

            const result = await client.search(get(resolvedData, ['address']))

            resolvedData['address'] = get(result, 'address')
            resolvedData['addressKey'] = get(result, 'addressKey')
            resolvedData['addressSources'] = get(result, 'addressSources', [])

            resolvedData['addressMeta'] = {
                dv: 1,
                value: get(result, ['addressMeta', 'value'], ''),
                unrestricted_value: get(result, ['addressMeta', 'unrestricted_value'], ''),
                data: get(result, ['addressMeta', 'data'], null),
            }
        }

        return resolvedData
    }
    // hooks.resolveInput = composeResolveInputHook(hooks.resolveInput, newResolveInput)

    return { fields: { ...fields, ...fieldsToAdd }, hooks, ...rest }
})

module.exports = { addressService }
