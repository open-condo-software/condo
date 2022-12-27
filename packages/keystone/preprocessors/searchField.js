const { isEmpty, isString, isFunction, get, isNumber, isNil, isObject, isArray } = require('lodash')
const { getSchemaCtx, getByCondition, find } = require('../schema')
const { composeResolveInputHook, composeNonResolveInputHook } = require('../plugins/utils')


// TODO (DOMA-4545)
//  [✔] Need add index for search field
//  [✔] Add a check for changes to tracked fields
//  [✔] Add search field update when related entities update
//  [✔] Add search field update when related entities was deleted
//  [✔] Move logic to global preprocessor
//  [ ] Fixed default value for field (?)
//  [ ] Add check for related fields (?)

//region addSearchField

const SEARCH_FIELD_DEFAULT_VALUE = '""'
const FIELD_NAME_REGEX = /^[a-z]+$/i

const SEARCH_OPTIONS = {
    schemaDoc: 'Service field for searching by different fields',
    type: 'Text',
    kmigratorOptions: { null: false },
    defaultValue: SEARCH_FIELD_DEFAULT_VALUE,
    access: {
        create: false,
        read: true,
        update: true,
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
        read: true,
        update: true,
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

//endregion

//region addSearchUpdateTrigger

const getRelatedItemsWhere = (triggerPathToFieldInArrays, existingItem) => {
    const parts = []

    for (const pathToFieldInArray of triggerPathToFieldInArrays) {
        let part

        const reversed = pathToFieldInArray.slice(0, -1).reverse()
        for (const fieldName of reversed) {
            if (!part) {
                part = { [fieldName]: { id: existingItem.id } }
            }
            else {
                part = { [fieldName]: part }
            }
        }

        if (part || isObject(part)) {
            parts.push(part)
        }
    }

    return {
        OR: parts,
    }
}

const getAllRelatedItems = async (targetSchema, triggerPathToFieldInArray, existingItem) => {
    const where = getRelatedItemsWhere(triggerPathToFieldInArray, existingItem)
    return await find(targetSchema, where)
}

const getContext = async (schemaName) => {
    const { keystone } = await getSchemaCtx(schemaName)
    return await keystone.createContext({ skipAccessControl: true })
}

/**
 * @param {RelatedData[]} relatedData
 */
const checkRelatedDate = (relatedData) => {
    if (!relatedData || !isArray(relatedData)) throw new Error('"relatedData" field must be of type "array" and not empty!')

    for (const { targetSchema, schemaGql, triggerPathsToFields, searchFieldName } of relatedData) {
        if (!targetSchema || !isString(targetSchema)) throw new Error('"targetSchema" field must be of type "string"!')
        if (searchFieldName && !isString(searchFieldName)) throw new Error('"searchFieldName" field must be of type "string"!')

        if (!triggerPathsToFields || !isArray(triggerPathsToFields) || isEmpty(triggerPathsToFields)) throw new Error('"triggerPathsToFields" field must be of type "array" and not empty!')
        for (const triggerPathToField of triggerPathsToFields) {
            if (!triggerPathToField || !isString(triggerPathToField)) throw new Error('"triggerPathsToFields" field must be contained elements with type "string"!')
            if (triggerPathToField.split('.').length < 2) throw new Error('"triggerPathsToFields" field must be contained element with path to related field!')
        }

        if (!schemaGql) throw new Error('"schemaGql" field is required')
    }
}

const updateRelatedItems = async ({ targetSchema, triggerPathsToFieldsDetails, existingItem, schemaGql, searchFieldName }) => {
    const relatedItems = await getAllRelatedItems(targetSchema, triggerPathsToFieldsDetails.map(item => item.pathInArray), existingItem)
    for (const item of relatedItems) {
        const id = get(item, 'id')
        const searchVersion = get(item, `${searchFieldName}Version`)
        if (id && searchVersion) {
            const context = await getContext(targetSchema)
            const payload = {
                dv: 1,
                sender: { fingerprint: 'change-search-field', dv: 1 },
                searchVersion: searchVersion + 1,
            }
            try {
                await schemaGql.update(context, id, payload)
            } catch (e) {
                console.log('ERROR!', e)
            }
        }
    }
}

/**
 * @typedef RelatedData
 * @property {string} targetSchema
 * @property schemaGql
 * @property {string} schemaName
 * @property {string[]} triggerPathsToFields
 * @property {string?} searchFieldName
 */

/**
 * @typedef TriggerPathsToFieldsDetail
 * @property {string} path
 * @property {string[]} pathInArray
 * @property {string} valueFieldName
 */

/**
 * @param {RelatedData[]} relatedData
 */
const addSearchUpdateTrigger = (relatedData = []) => (schema) => {
    const { hooks = {}, ...rest } = schema

    checkRelatedDate(relatedData)

    /**
     * @type {(RelatedData & {triggerPathsToFieldsDetails: TriggerPathsToFieldsDetail[]})[]}
     */
    const preprocessedRelatedData = relatedData.map(item => ({
        ...item,
        searchFieldName: item.searchFieldName || 'search',
        triggerPathsToFieldsDetails: item.triggerPathsToFields.map(path => {
            const pathInArray = path.split('.')
            return {
                path,
                pathInArray,
                valueFieldName: pathInArray[pathInArray.length - 1],
            }
        }),
    }))

    const afterChangeHook = async (props) => {
        const { existingItem, updatedItem, operation } = props
        if (operation === 'update') {
            for (const { targetSchema, schemaGql, triggerPathsToFieldsDetails, searchFieldName } of preprocessedRelatedData) {
                const isUpdatedTriggerFields = triggerPathsToFieldsDetails.some(({ valueFieldName }) => isUpdatedField({
                    prevValue: existingItem,
                    newValue: updatedItem,
                    field: valueFieldName,
                }))
                if (isUpdatedTriggerFields) {
                    await updateRelatedItems({ targetSchema, triggerPathsToFieldsDetails, existingItem, schemaGql, searchFieldName })
                }
            }
        }
    }

    const afterDeleteHook = async (props) => {
        const { existingItem, operation } = props
        if (operation === 'delete') {
            for (const { targetSchema, schemaGql, triggerPathsToFieldsDetails, searchFieldName } of preprocessedRelatedData) {
                await updateRelatedItems({ targetSchema, triggerPathsToFieldsDetails, existingItem, schemaGql, searchFieldName })
            }
        }
    }

    const originalAfterChange = hooks.afterChange
    hooks.afterChange = composeNonResolveInputHook(originalAfterChange, afterChangeHook)
    const originalAfterDelete = hooks.afterDelete
    hooks.afterDelete = composeNonResolveInputHook(originalAfterDelete, afterDeleteHook)

    return { hooks, ...rest }
}

//endregion

/**
 * @typedef Triggers
 * @property {string} schema
 * @property {RelatedData[]} relatedData
 */

/**
 * @typedef RelatedField
 * @property {string} schemaName
 * @property {string[]} pathsToFields
 * @property schemaGql
 */

/**
 * @typedef SimpleFields
 * @property {string[]} pathsToFields
 * @property {Object<string, function>} preprocessorsForFields
 */

/**
 * @typedef SearchFieldParameter
 * @property {string?} searchField
 * @property {string} schemaName
 * @property {SimpleFields?} simpleFields
 * @property {RelatedField[]?} relatedFields
 */

/**
 * @param {SearchFieldParameter[]} searchFieldsParameters
 */
const searchFieldPreprocessor = (searchFieldsParameters = []) => {
    /**
     * @type {RelatedData[]}
     */
    const allRelatedFields = searchFieldsParameters.flatMap((params) => params.relatedFields.map((item) => ({
        schemaGql: item.schemaGql,
        searchFieldName: params.searchField,
        targetSchema: params.schemaName,
        triggerPathsToFields: item.pathsToFields,
        schemaName: item.schemaName,
    })))

    return (schemaType, schemaName, schema) => {
        const params = searchFieldsParameters.find((item) => item.schemaName === schemaName)
        if (params) {
            console.log(' ---> addSearchField', schemaName)
            return addSearchField({
                searchField: params.searchField,
                pathsToFields: [...params.simpleFields.pathsToFields, ...allRelatedFields.filter((item) => item.targetSchema).flatMap((item) => item.triggerPathsToFields)],
                preprocessorsForFields: params.simpleFields.preprocessorsForFields,
            })(schema)
        }
        const relatedData = allRelatedFields.filter((item) => item.schemaName === schemaName)
        if (!isEmpty(relatedData)) {
            console.log(' ---> addSearchUpdateTrigger', schemaName)
            return addSearchUpdateTrigger(relatedData)(schema)
        }

        return schema
    }
}

module.exports = {
    searchFieldPreprocessor,
}
