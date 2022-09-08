const conf = require('@condo/config')
const { ADDRESS_META_FIELD } = require('@condo/keystone/plugins/utils/addressMetaDefinition')
const { composeResolveInputHook } = require('@condo/keystone/plugins/utils')
const { plugin } = require('@condo/keystone/plugins/utils/typing')
const { Text } = require('@keystonejs/fields')
const { createInstance: createAddressServiceClientInstance } = require('@condo/address-service-client')
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
    const newResolveInput = ({ resolvedData, operation, context }) => {
        // In the case of empty `addressKey` field we need to get this key from external address service
        if (!resolvedData[getKeyFieldName(addressFieldName)]) {
            const client = createAddressServiceClientInstance(get(conf, 'ADDRESS_SERVICE_URL'), { geo: 'dadata' })
        }

        return resolvedData
    }
    hooks.resolveInput = composeResolveInputHook(hooks.resolveInput, newResolveInput)

    return { fields: { ...fields, ...fieldsToAdd }, hooks, ...rest }
})

module.exports = { addressService }
