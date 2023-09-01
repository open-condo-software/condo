const get = require('lodash/get')
const pluralize = require('pluralize')

const { getByCondition } = require('@open-condo/keystone/schema')


const DEFAULT_CHECKBOX_FIELD = {
    type: 'Checkbox',
    isRequired: true,
    defaultValue: false,
}

function _capitalize (input) {
    return `${input.charAt(0).toUpperCase()}${input.slice(1)}`
}


/**
 * Fills default values in case when list is passed as string
 * @param {DirectAccessList | string} directListConfig
 * @return {DirectAccessList}
 * @private
 */
function _getListConfig (directListConfig) {
    if (typeof directListConfig === 'string') {
        return { schemaName: directListConfig, readonly: false }
    } else {
        return directListConfig
    }
}

function generateReadSchemaFieldName (schemaName) {
    return `canRead${pluralize.plural(schemaName)}`
}

function generateManageSchemaFieldName (schemaName) {
    return `canManage${pluralize.plural(schemaName)}`
}

function generateExecuteServiceFieldName (serviceName) {
    return `canExecute${_capitalize(serviceName)}`
}

/**
 * Based on provided config generates all field names,
 * which are used in gql.js as well as in field generation
 * @param {DirectAccessConfig} config
 * @return {string[]}
 */
function generateFieldNames (config) {
    const fields = []
    for (const listSchema of config.lists) {
        const listConfig = _getListConfig(listSchema)
        fields.push(generateReadSchemaFieldName(listConfig.schemaName))
        if (!listConfig.readonly) {
            fields.push(generateManageSchemaFieldName(listConfig.schemaName))
        }
    }
    for (const serviceName of config.services) {
        fields.push(generateExecuteServiceFieldName(serviceName))
    }

    return fields
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
        const listConfig = _getListConfig(listSchema)
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
    generateFieldNames,
    canDirectlyReadSchemaObjects,
    canDirectlyManageSchemaObjects,
    canDirectlyExecuteService,
}