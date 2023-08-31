const pluralize = require('pluralize')


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

function generateReadSchemaField (schemaName) {
    return `canRead${pluralize.plural(schemaName)}`
}

function generateManageSchemaField (schemaName) {
    return `canManage${pluralize.plural(schemaName)}`
}

function generateExecuteServiceField (serviceName) {
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
        fields.push(generateReadSchemaField(listConfig.schemaName))
        if (!listConfig.readonly) {
            fields.push(generateManageSchemaField(listConfig.schemaName))
        }
    }
    for (const serviceName of config.services) {
        fields.push(generateExecuteServiceField(serviceName))
    }

    return fields
}

/**
 * Generates a set of Keystone fields based on provided config. Obtained fields are used to form UserRightSet schema.
 * @typedef {{ schemaDoc: string, type: 'Checkbox', defaultValue: false, isRequired: true }} CheckboxField
 * @param {DirectAccessConfig} config
 * @return {Record<string, CheckboxField>}
 */
function generateRightSetFields (config) {
    const fields = {}

    for (const listSchema of config.lists) {
        const listConfig = _getListConfig(listSchema)
        fields[generateReadSchemaField(listConfig.schemaName)] = {
            ...DEFAULT_CHECKBOX_FIELD,
            schemaDoc:
                `Enables a user with the given UserRightSet to view all entities of model "${listConfig.schemaName}" ` +
                'as support / admin users do',
        }
        if (!listConfig.readonly) {
            fields[generateManageSchemaField(listConfig.schemaName)] = {
                ...DEFAULT_CHECKBOX_FIELD,
                schemaDoc:
                    'Enables a user with the given UserRightSet to ' +
                    `create, update or soft-delete entities of model "${listConfig.schemaName}" ` +
                    'similar to support users',
            }
        }
    }

    for (const serviceName of config.services) {
        fields[generateExecuteServiceField(serviceName)] = {
            ...DEFAULT_CHECKBOX_FIELD,
            schemaDoc: `Enables a user with the given UserRightSet to execute "${serviceName}" query/mutation`,
        }
    }

    return fields
}

module.exports = {
    generateRightSetFields,
    generateFieldNames,
}