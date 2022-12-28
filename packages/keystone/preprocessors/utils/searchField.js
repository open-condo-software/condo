const { isEmpty, isString, isFunction, get, isNumber, isNil } = require('lodash')

const { canOnlyServerSideWithoutUserRequest } = require('../../access')
const { getSchemaCtx, getByCondition } = require('../../schema')
const { composeResolveInputHook } = require('../../plugins/utils')


const SEARCH_FIELD_DEFAULT_VALUE = '""'
const FIELD_NAME_REGEX = /^[a-z]+$/i

const SEARCH_OPTIONS = {
    schemaDoc: 'Field for searching by different fields',
    type: 'Text',
    kmigratorOptions: { null: false },
    defaultValue: SEARCH_FIELD_DEFAULT_VALUE,
    access: {
        create: false,
        read: true,
        update: false,
    },
    knexOptions: { defaultTo: () => SEARCH_FIELD_DEFAULT_VALUE },
}
const SEARCH_VERSION_OPTIONS = {
    schemaDoc: 'Service field for versioning the search field by different fields',
    type: 'Integer',
    isRequired: true,
    defaultValue: 1,
    access: {
        create: false,
        read: false,
        update: canOnlyServerSideWithoutUserRequest,
    },
    knexOptions: { defaultTo: () => 1 },
}

const getSearchIndexOptions = (searchField) => ({
    type: 'GinIndex',
    opclasses: ['gin_trgm_ops'],
    fields: [searchField],
    name: 'Ticket_searchField_idx',
})

const getPathToFieldInArray = (pathToField) => pathToField.split('.')

const checkPathsToFields = (pathsToFields) => {
    if (isEmpty(pathsToFields)) throw new Error('The search must occur on at least one field!')
    for (const pathToField of pathsToFields) {
        if (!isString(pathToField)) throw new Error(`Each element of the "pathsToFields" array must be of type "string"!. But it was: "${typeof pathToField}" for path "${pathToField}"`)
        const pathToFieldToArray = pathToField.split('.')
        for (const field of pathToFieldToArray) {
            if (!FIELD_NAME_REGEX.test(field)) throw new Error(`Field names must consist of letters (a-z) and must be in the format "fieldName" or "fieldName1.fieldName2" (if the field is in a related schema)! But it was: "${field}" in path "${pathToField}".`)
        }
    }
}

const checkPreprocessors = (preprocessorsForFields) => {
    for (const field in preprocessorsForFields) {
        const preprocessor = preprocessorsForFields[field]
        if (!isFunction(preprocessor)) throw new Error(`Preprocessors must be functions! But it was: "${typeof preprocessor}" for the field "${field}"`)
    }
}

const getRefSchemaByField = async (schemaName, nextFieldName) => {
    try {
        const schema = await getSchemaCtx(schemaName)
        return schema.keystone.getListByKey(schemaName)._fields[nextFieldName].ref
    } catch (e) {
        return null
    }
}

const getValueFromRelatedSchema = async (schemaName, id, pathToFieldToArray) => {
    const item = await getByCondition(schemaName, {
        id,
    })
    if (!item) return null

    const fieldName = pathToFieldToArray[0]
    const nextFieldRef = await getRefSchemaByField(schemaName, fieldName)
    const nextFieldValue = item[fieldName]
    if (!nextFieldRef) return nextFieldValue
    if (pathToFieldToArray.length === 1) return null
    if (!nextFieldValue) return null

    return await getValueFromRelatedSchema(nextFieldRef, nextFieldValue, pathToFieldToArray.slice(1))
}

const getValueByPathToField = async (pathToFieldInArray, item, schemaFields) => {
    const fieldName = pathToFieldInArray[0]
    const fieldParams = schemaFields[fieldName]
    if (!fieldParams) return null

    const fieldRef = fieldParams.ref
    const fieldValue = item[fieldName]
    if (!fieldRef) return fieldValue
    if (pathToFieldInArray.length === 1) return null
    if (!fieldValue) return null

    return await getValueFromRelatedSchema(fieldRef, fieldValue, pathToFieldInArray.slice(1))
}

const updateSearchFieldVersion = (props) => {
    const { operation, pathsToFields, existingItem, resolvedData, searchVersionField } = props

    if (operation === 'update') {
        const fieldsForSearch = pathsToFields.map(item => getPathToFieldInArray(item)[0])
        const newItem = { ...existingItem, ...resolvedData }
        if (fieldsForSearch.some(field => isUpdatedField({ field, prevValue: existingItem, newValue: newItem }))) {
            const prevSearchVersion = get(existingItem, searchVersionField)
            if (prevSearchVersion && isNumber(prevSearchVersion)) {
                resolvedData[searchVersionField] = prevSearchVersion + 1
            }
        }
    }
}

const updateSearchField = async (props) => {
    const { resolvedData, newItem, pathsToFields, preprocessorsForFields, searchField, fields, existingItem, operation, searchVersionField } = props

    const prevSearchVersion = get(existingItem, searchVersionField, 1)
    const nextSearchVersion = get(resolvedData, searchVersionField, 1)

    if ((operation === 'update' && prevSearchVersion < nextSearchVersion) || operation === 'create') {
        const values = []

        for (const pathToField of pathsToFields) {
            const pathToFieldInArray = getPathToFieldInArray(pathToField)
            const value = await getValueByPathToField(pathToFieldInArray, newItem, fields)
            const preprocessor = preprocessorsForFields[pathToField]
            const preprocessedValue = preprocessor ? preprocessor(value) : value
            values.push(preprocessedValue)
        }

        resolvedData[searchField] = values.filter(item => !isNil(item)).join(' ')
    }
}

const isUpdatedField = ({ field, prevValue, newValue }) => {
    return get(prevValue, field) !== get(newValue, field)
}

/**
 * @param {object} obj
 * @param {string?} obj.searchField
 * @param {string[]} obj.pathsToFields
 * @param {Object<string, function>} obj.preprocessorsForFields
 */
const addSearchField = ({ searchField = 'search', pathsToFields = [], preprocessorsForFields = {} } = {}) => (schema) => {
    const { fields = {}, hooks = {}, kmigratorOptions = {}, ...rest } = schema

    if (!isString(searchField) || !searchField) throw new Error('Еhe name of the search field must be of type "string"!')
    checkPathsToFields(pathsToFields)
    checkPreprocessors(preprocessorsForFields)

    const searchVersionField = `${searchField}Version`

    fields[searchField] = { ...SEARCH_OPTIONS }
    fields[searchVersionField] = { ...SEARCH_VERSION_OPTIONS }

    const newResolveInput = async (props) => {
        const { resolvedData, existingItem, operation } = props
        const newItem = { ...existingItem, ...resolvedData }
        updateSearchFieldVersion({ operation, pathsToFields, existingItem, resolvedData, searchVersionField })
        await updateSearchField({ resolvedData, newItem, pathsToFields, preprocessorsForFields, searchField, fields, existingItem, operation, searchVersionField })
        return resolvedData
    }

    const originalResolveInput = hooks.resolveInput
    hooks.resolveInput = composeResolveInputHook(originalResolveInput, newResolveInput)

    kmigratorOptions.indexes = [
        ...get(kmigratorOptions, 'indexes', []),
        getSearchIndexOptions(searchField),
    ]

    return { fields, hooks, kmigratorOptions, ...rest }
}

module.exports = {
    addSearchField,
    FIELD_NAME_REGEX,
}
