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

const getSourceFieldName = (mainFieldName) => `${mainFieldName}Sources`
const getKeyFieldName = (mainFieldName) => `${mainFieldName}Key`
const getMetaFieldName = (mainFieldName) => `${mainFieldName}Meta`

const getFieldsToAdd = (mainField, fieldsHooks) => ({
    [mainField]: {
        schemaDoc: 'Normalized address',
        type: Text,
        isRequired: true,
        hooks: {
            ...(fieldsHooks[mainField] || {}),
        },
    },
    [getSourceFieldName(mainField)]: {
        type: Json,
        schemaDoc: 'The origins of the address (some strings which may looks like real address or some id)',
        access: readOnlyAccess,
        hooks: {
            ...(fieldsHooks[getSourceFieldName(mainField)] || {}),
        },
    },
    [getKeyFieldName(mainField)]: {
        type: Text,
        schemaDoc: 'The unique key of the address',
        access: readOnlyAccess,
        hooks: {
            ...(fieldsHooks[getKeyFieldName(mainField)] || {}),
        },
    },
    [getMetaFieldName(mainField)]: ADDRESS_META_FIELD,
})

/**
 * Plugin to extend address field with address service
 * @param {string?} addressFieldName
 * @param {Object} fieldsHooks
 */
const addressService = (addressFieldName = 'address', fieldsHooks = {}) => plugin(({
    fields = {},
    hooks = {},
    ...rest
}, schemaObj) => {
    if (!addressFieldName) {
        throw new Error('The `addressFieldName` field is not set')
    }

    //
    // Modify fields
    //
    const fieldsToAdd = getFieldsToAdd(addressFieldName, fieldsHooks)

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
        // We will call to address service in the following cases:
        if (
            // 1. In the case of new property/resident creation
            (operation === 'create' && !resolvedData[getKeyFieldName(addressFieldName)])

            // 2. In the case of property/resident update and updating property/resident has no address key for some reason
            || (operation === 'update' && !existingItem[getKeyFieldName(addressFieldName)])

            // 3. In the case of update and if property/resident address has been changed
            || (operation === 'update' && !!resolvedData[addressFieldName] && existingItem[addressFieldName] !== resolvedData[addressFieldName])
        ) {
            const client = conf.NODE_ENV === 'test' || get(conf, 'ADDRESS_SERVICE_CLIENT_MODE') === 'fake'
                ? createTestAddressServiceClientInstance({ ...existingItem, ...resolvedData })
                : createAddressServiceClientInstance(get(conf, 'ADDRESS_SERVICE_URL'))

            const result = await client.search(get(resolvedData, ['addressMeta', 'rawValue'], resolvedData[addressFieldName]))

            resolvedData[getSourceFieldName(addressFieldName)] = get(result, 'addressSources')
            resolvedData[addressFieldName] = get(result, 'address')
            resolvedData[getKeyFieldName(addressFieldName)] = get(result, 'addressKey')

            resolvedData[getMetaFieldName(addressFieldName)] = {
                dv: 1,
                value: get(result, ['addressMeta', 'value'], ''),
                unrestricted_value: get(result, ['addressMeta', 'unrestricted_value'], ''),
                data: get(result, ['addressMeta', 'data'], null),
            }
        }

        return resolvedData
    }
    hooks.resolveInput = composeResolveInputHook(hooks.resolveInput, newResolveInput)

    return { fields: { ...fields, ...fieldsToAdd }, hooks, ...rest }
})

module.exports = { addressService }
