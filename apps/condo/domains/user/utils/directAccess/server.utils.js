const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')

const { getByCondition } = require('@open-condo/keystone/schema')

const {
    getListConfig,
    generateReadSchemaFieldName,
    generateManageSchemaFieldName,
    generateExecuteServiceFieldName,
    generateFieldNameToManageField,
} = require('./common.utils')
const { DIRECT_ACCESS_AVAILABLE_SCHEMAS } = require('./config')


const DEFAULT_CHECKBOX_FIELD = {
    type: 'Checkbox',
    isRequired: true,
    defaultValue: false,
}

/**
 * @typedef {Object} CheckboxField
 * @property {string} schemaDoc
 * @property {'Checkbox'} type
 * @property {false} defaultValue
 * @property {true} isRequired
 */

/**
 * Generates a set of Keystone fields based on provided config. Obtained fields are used to form UserRightsSet schema.
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

    const fieldsConfig = Object.entries(config.fields)
    for (const [schemaName, fieldNames] of fieldsConfig) {
        for (const fieldName of fieldNames) {
            fields[generateFieldNameToManageField(schemaName, fieldName)] = {
                ...DEFAULT_CHECKBOX_FIELD,
                schemaDoc:
                    `Enables a user with the given UserRightsSet to update "${fieldName}" field of model "${schemaName}"`,
            }
        }
    }

    return fields
}
/**
 * @typedef {undefined | Record<string, any>} AuthUser
 */

/**
 * Checks if user has specific right in his UserRightsSet
 * @param {AuthUser} user - user obtained from Keystone access function
 * @param {string[]} rightNames - names of the right to check
 * @return {Promise<boolean>}
 * @private
 */
async function _hasSpecificRights (user, rightNames) {
    if (!user || !user.rightsSet) {
        return false
    }

    const rightsSet = await getByCondition( 'UserRightsSet', { id: user.rightsSet, deletedAt: null })

    return !!rightsSet && rightNames.every(rightName => get(rightsSet, rightName, false))
}

/**
 * Checks if user can read all GQLListSchema objects directly.
 * @param {AuthUser} user - user obtained from Keystone access function
 * @param {string} schemaName - name of list to check read right for
 * @return {Promise<boolean>}
 */
async function canDirectlyReadSchemaObjects (user, schemaName) {
    return await _hasSpecificRights(user, [generateReadSchemaFieldName(schemaName)])
}

const FIELD_NAMES_TO_SKIP_ACCESS = ['dv', 'sender']

/**
 * Checks if user can create/update/soft-delete all GQLListSchema objects directly.
 * @param {AuthUser} user - user obtained from Keystone access function
 * @param {string} schemaName - name of list to check manage right for
 * @param {Object} originalInput
 * @param {string} operation
 * @return {Promise<boolean>}
 */
async function canDirectlyManageSchemaObjects (user, schemaName, originalInput, operation) {
    const fieldNamesWithAccess = get(DIRECT_ACCESS_AVAILABLE_SCHEMAS, ['fields', schemaName], [])
    const isUpdateOperation = operation === 'update'

    const originalInputFieldNames = Object.keys(originalInput).filter(fieldName => !FIELD_NAMES_TO_SKIP_ACCESS.includes(fieldName))
    const fieldNamesToCheckRights = originalInputFieldNames.filter(originalInputFieldName => fieldNamesWithAccess.includes(originalInputFieldName))
    const commonFieldNamesToUpdate = originalInputFieldNames.filter(originalInputFieldName => !fieldNamesWithAccess.includes(originalInputFieldName))

    const canManageObjects = await _hasSpecificRights(user, [generateManageSchemaFieldName(schemaName)])
    if (!isUpdateOperation && !canManageObjects) return false

    let canManageFields = false
    if (!isEmpty(fieldNamesToCheckRights)) {
        const rightNamesToCheck = fieldNamesToCheckRights.map(fieldName => generateFieldNameToManageField(schemaName, fieldName))
        canManageFields = await _hasSpecificRights(user, rightNamesToCheck)
    }

    if (!isEmpty(fieldNamesToCheckRights) && !isEmpty(commonFieldNamesToUpdate)) {
        return canManageObjects && canManageFields
    }
    if (!isEmpty(fieldNamesToCheckRights) && isEmpty(commonFieldNamesToUpdate)) {
        return canManageFields
    }

    return canManageObjects
}

/**
 * Checks if user can execute query/mutation from GQLCustomSchema service
 * @param {AuthUser} user - user obtained from Keystone access function
 * @param {string} serviceName - name of service (query/mutation) to check access for
 * @return {Promise<boolean>}
 */
async function canDirectlyExecuteService (user, serviceName) {
    return await _hasSpecificRights(user, [generateExecuteServiceFieldName(serviceName)])
}


module.exports = {
    generateRightSetFields,
    canDirectlyReadSchemaObjects,
    canDirectlyManageSchemaObjects,
    canDirectlyExecuteService,
}