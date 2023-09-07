const get = require('lodash/get')

const { getByCondition } = require('@open-condo/keystone/schema')

const {
    getListConfig,
    generateReadSchemaFieldName,
    generateManageSchemaFieldName,
    generateExecuteServiceFieldName,
} = require('./common.utils')



const DEFAULT_CHECKBOX_FIELD = {
    type: 'Checkbox',
    isRequired: true,
    defaultValue: false,
}

/**
 * Generates a set of Keystone fields based on provided config. Obtained fields are used to form UserRightsSet schema.
 * @typedef {{ schemaDoc: string, type: 'Checkbox', defaultValue: false, isRequired: true }} CheckboxField
 * @param {DirectAccessConfig} config
 * @return {Record<string, CheckboxField>}
 */
function generateRightSetFields (config) {
    const fields = {}

    for (const listSchema of config.lists) {
        const listConfig = getListConfig(listSchema)
        fields[generateReadSchemaFieldName(listConfig.schemaName)] = {
            ...DEFAULT_CHECKBOX_FIELD,
            schemaDoc:
                `Enables a user with the given UserRightsSet to view all entities of model "${listConfig.schemaName}" ` +
                'as support / admin users do',
        }
        if (!listConfig.readonly) {
            fields[generateManageSchemaFieldName(listConfig.schemaName)] = {
                ...DEFAULT_CHECKBOX_FIELD,
                schemaDoc:
                    'Enables a user with the given UserRightsSet to ' +
                    `create, update or soft-delete entities of model "${listConfig.schemaName}" ` +
                    'similar to support users',
            }
        }
    }

    for (const serviceName of config.services) {
        fields[generateExecuteServiceFieldName(serviceName)] = {
            ...DEFAULT_CHECKBOX_FIELD,
            schemaDoc: `Enables a user with the given UserRightsSet to execute "${serviceName}" query/mutation`,
        }
    }

    return fields
}

/**
 * Checks if user has specific right in his UserRightsSet
 * @typedef {undefined | Record<string, any>} AuthUser
 * @param {AuthUser} user - user obtained from Keystone access function
 * @param {string} rightName - name of the right to check
 * @return {Promise<boolean>}
 * @private
 */
async function _hasSpecificRight (user, rightName) {
    if (!user || !user.rightsSet) {
        return false
    }

    const rightsSet = await getByCondition( 'UserRightsSet', { id: user.rightsSet, deletedAt: null })

    return get(rightsSet, rightName, false)
}

/**
 * Checks if user can read all GQLListSchema objects directly.
 * @param {AuthUser} user - user obtained from Keystone access function
 * @param {string} schemaName - name of list to check read right for
 * @return {Promise<boolean>}
 */
async function canDirectlyReadSchemaObjects (user, schemaName) {
    return await _hasSpecificRight(user, generateReadSchemaFieldName(schemaName))
}

/**
 * Checks if user can create/update/soft-delete all GQLListSchema objects directly.
 * @param {AuthUser} user - user obtained from Keystone access function
 * @param {string} schemaName - name of list to check manage right for
 * @return {Promise<boolean>}
 */
async function canDirectlyManageSchemaObjects (user, schemaName) {
    return await _hasSpecificRight(user, generateManageSchemaFieldName(schemaName))
}

/**
 * Checks if user can execute query/mutation from GQLCustomSchema service
 * @param {AuthUser} user - user obtained from Keystone access function
 * @param {string} serviceName - name of service (query/mutation) to check access for
 * @return {Promise<boolean>}
 */
async function canDirectlyExecuteService (user, serviceName) {
    return await _hasSpecificRight(user, generateExecuteServiceFieldName(serviceName))
}


module.exports = {
    generateRightSetFields,
    canDirectlyReadSchemaObjects,
    canDirectlyManageSchemaObjects,
    canDirectlyExecuteService,
}