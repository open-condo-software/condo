const { isObject, isArray, isString, isEmpty, get } = require('lodash')

const { find, getSchemaCtx } = require('../../schema')
const { composeNonResolveInputHook } = require('../../plugins/utils')


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

const getContextWithoutAccess = async (schemaName) => {
    const { keystone } = await getSchemaCtx(schemaName)
    return await keystone.createContext({ skipAccessControl: true })
}

const isUpdatedField = ({ field, prevValue, newValue }) => {
    return get(prevValue, field) !== get(newValue, field)
}

/**
 * @param {RelatedData[]} relatedData
 */
const checkRelatedData = (relatedData) => {
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
            const context = await getContextWithoutAccess(targetSchema)
            const payload = {
                dv: 1,
                sender: { fingerprint: 'change-search-field', dv: 1 },
                searchVersion: searchVersion + 1,
            }
            try {
                await schemaGql.update(context, id, payload)
            } catch (e) {
                console.error('ERROR updating search field after updating related field!', e)
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

    checkRelatedData(relatedData)

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

module.exports = {
    addSearchUpdateTrigger,
}
