const pluralize = require('pluralize')

const { DIRECT_ACCESS_AVAILABLE_SCHEMAS } = require('./config')

/**
 * @type {Map<string, string[]>}
 */
const fieldNamesBySchemaName = new Map()

const getFieldNamesBySchemaName = (schemaName) => {
    if (fieldNamesBySchemaName.has(schemaName)) {
        return fieldNamesBySchemaName.get(schemaName)
    } else {
        const fieldConfigs = DIRECT_ACCESS_AVAILABLE_SCHEMAS.fields.filter(config => config.schemaName === schemaName)
        const fieldNames = fieldConfigs.map(config => config.fieldName)
        fieldNamesBySchemaName.set(schemaName, fieldNames)
        return fieldNames
    }
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
function getListConfig (directListConfig) {
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

function generateFieldNameToManageField (schemaName, fieldName) {
    return `canManage${schemaName}${fieldName.slice(0, 1).toUpperCase() + fieldName.slice(1)}Field`
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
        const listConfig = getListConfig(listSchema)
        fields.push(generateReadSchemaFieldName(listConfig.schemaName))
        if (!listConfig.readonly) {
            fields.push(generateManageSchemaFieldName(listConfig.schemaName))
        }
    }
    for (const serviceName of config.services) {
        fields.push(generateExecuteServiceFieldName(serviceName))
    }
    for (const fieldConfig of config.fields) {
        fields.push(generateFieldNameToManageField(fieldConfig.schemaName, fieldConfig.fieldName))
    }

    return fields
}

module.exports = {
    getFieldNamesBySchemaName,
    getListConfig,
    generateFieldNameToManageField,
    generateReadSchemaFieldName,
    generateManageSchemaFieldName,
    generateExecuteServiceFieldName,
    generateFieldNames,
}