const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')

const { getByCondition } = require('@open-condo/keystone/schema')

const {
    getListConfig,
    generateReadSchemaFieldName,
    generateManageSchemaFieldName,
    generateExecuteServiceFieldName,
    generateReadSensitiveFieldFieldName,
    generateManageSensitiveFieldFieldName,
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

    for (const [schemaName, schemaFields] of Object.entries(config.fields)) {
        for (const field of schemaFields) {
            if (field.read) {
                fields[generateReadSensitiveFieldFieldName(schemaName, field.fieldName)] = {
                    ...DEFAULT_CHECKBOX_FIELD,
                    schemaDoc:
                        `Enables a user with the given UserRightsSet to read "${field.fieldName}" field of model "${schemaName}"`,
                    access: field.userRightsSetAccess,
                }
            }
            if (field.manage) {
                fields[generateManageSensitiveFieldFieldName(schemaName, field.fieldName)] = {
                    ...DEFAULT_CHECKBOX_FIELD,
                    schemaDoc:
                        `Enables a user with the given UserRightsSet to update "${field.fieldName}" field of model "${schemaName}"`,
                    access: field.userRightsSetAccess,
                }
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
        .filter(schemaField => schemaField.manage)
        .map(schemaField => schemaField.fieldName)

    const originalInputFieldNames = Object.keys(originalInput).filter(fieldName => !FIELD_NAMES_TO_SKIP_ACCESS.includes(fieldName))
    const fieldNamesToCheckRights = originalInputFieldNames.filter(originalInputFieldName => fieldNamesWithAccess.includes(originalInputFieldName))
    const commonFieldNamesToUpdate = originalInputFieldNames.filter(originalInputFieldName => !fieldNamesWithAccess.includes(originalInputFieldName))

    const rightsToCheck = fieldNamesToCheckRights.map(fieldName => generateManageSensitiveFieldFieldName(schemaName, fieldName))

    const shouldCheckSchema = (operation !== 'update') || (!isEmpty(commonFieldNamesToUpdate))

    if (shouldCheckSchema) {
        rightsToCheck.push(generateManageSchemaFieldName(schemaName))
    }

    return await _hasSpecificRights(user, rightsToCheck)
}

async function canDirectlyReadSchemaField (user, schemaName, fieldName) {
    return await _hasSpecificRights(user, [generateReadSensitiveFieldFieldName(schemaName, fieldName)])
}

async function canDirectlyManageSchemaField (user, schemaName, fieldName) {
    return await _hasSpecificRights(user, [generateManageSensitiveFieldFieldName(schemaName, fieldName)])
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
    canDirectlyReadSchemaField,
    canDirectlyManageSchemaObjects,
    canDirectlyManageSchemaField,
    canDirectlyExecuteService,
}