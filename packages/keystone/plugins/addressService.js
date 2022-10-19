const conf = require('@condo/config')
const { ADDRESS_META_FIELD } = require('@condo/keystone/plugins/utils/addressMetaDefinition')
const { composeResolveInputHook } = require('@condo/keystone/plugins/utils')
const { plugin } = require('@condo/keystone/plugins/utils/typing')
const { Text } = require('@keystonejs/fields')
const {
    createInstance: createAddressServiceClientInstance,
    createTestInstance: createTestAddressServiceClientInstance,
} = require('@condo/address-service-client')
const get = require('lodash/get')

const readOnlyAccess = {
    read: true,
    create: false,
    update: false,
    delete: false,
}

const getSourceFieldName = (mainFieldName) => `${mainFieldName}Source`
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
        type: Text,
        schemaDoc: 'The origin of the address (some string which may looks like real address or some id)',
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
    /**
     * @todo(nas) This field may be different for different models
     * @see apps/condo/domains/ticket/schema/Ticket.js
     */
    [getMetaFieldName(mainField)]: ADDRESS_META_FIELD,
})

/**
 * This function must return fields according to jsdoc. Returned fields are in dadata format.
 * @param addressMeta
 * @returns {{data: Object, unrestricted_value: String}}
 */
function extractAndDadatifyAddressMeta (addressMeta) {
    const providerName = get(addressMeta, ['provider', 'name'])
    const rawData = get(addressMeta, ['provider', 'rawData'])

    let data
    let unrestricted_value

    switch (providerName) {
        case 'dadata':
            data = get(rawData, 'data', {})
            unrestricted_value = String(get(rawData, 'unrestricted_value'))
            break
        case 'google':
            data = {
                // todo(nas) convert google raw data to dadata format
            }
            unrestricted_value = ''
            break
        default:
            throw new Error(`Can not convert address meta due to no converter for '${providerName}' provider`)
    }

    return { data, unrestricted_value }
}

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
        return { fields, hooks, ...rest }
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
            // 1. In the case of new property creation
            (operation === 'create' && !resolvedData[getKeyFieldName(addressFieldName)])

            // 2. In the case of property update and updating property has no address key for some reason
            || (operation === 'update' && !existingItem[getKeyFieldName(addressFieldName)])

            // 3. In the case of update and if property address has been changed
            || (operation === 'update' && !!resolvedData[addressFieldName] && existingItem[addressFieldName] !== resolvedData[addressFieldName])
        ) {
            const client = conf.NODE_ENV === 'test' || get(conf, 'ADDRESS_SERVICE_CLIENT_MODE') === 'fake'
                ? createTestAddressServiceClientInstance({ ...existingItem, ...resolvedData })
                : createAddressServiceClientInstance(get(conf, 'ADDRESS_SERVICE_URL'))
            const result = await client.search(resolvedData[addressFieldName])

            resolvedData[getSourceFieldName(addressFieldName)] = resolvedData[addressFieldName]
            resolvedData[addressFieldName] = get(result, 'address')
            resolvedData[getKeyFieldName(addressFieldName)] = get(result, 'addressKey')

            //
            // Meta field processing.
            //

            // We use raw data of dadata (O_o) in many places of the code
            // So, we need to keep addressMeta field in the same format as before the address service appeared
            const addressMeta = get(result, 'addressMeta', {})
            const normalizedMetaFields = extractAndDadatifyAddressMeta(addressMeta)
            resolvedData[getMetaFieldName(addressFieldName)] = {
                dv: 1,
                address: get(result, 'address'),
                value: get(result, ['addressMeta', 'provider', 'rawData', 'value']),
                unrestricted_value: normalizedMetaFields.unrestricted_value,
                data: normalizedMetaFields.data,
            }
        }

        return resolvedData
    }
    hooks.resolveInput = composeResolveInputHook(hooks.resolveInput, newResolveInput)

    return { fields: { ...fields, ...fieldsToAdd }, hooks, ...rest }
})

module.exports = { addressService }
