const { isEmpty, isString, isNil, isFunction, get, isArray, isObject } = require('lodash')

const { plugin } = require('./utils/typing')
const { composeNonResolveInputHook } = require('./utils')
const { getSchemaCtx, find } = require('../schema')

const update = async (schemaName, id, payload) => {
    const schema = await getSchemaCtx(schemaName)
    // console.log({ ...schema.keystone.getListByKey(schemaName) })
    return await schema.keystone.getListByKey(schemaName).adapter.update(id, payload)
}

const getRefSchemaByField = async (schemaName, nextFieldName) => {
    try {
        const schema = await getSchemaCtx(schemaName)
        return schema.keystone.getListByKey(schemaName)._fields[nextFieldName].ref
    } catch (e) {
        return null
    }
}

const getRelatedSchemaName = async (schemaName, fieldName) => {
    if (!schemaName || !fieldName) return null
    const nextFieldRef = await getRefSchemaByField(schemaName, fieldName)
    if (!nextFieldRef) return null

    return nextFieldRef
}

const getAllSchemaNames = async (targetSchema, pathToFieldInArray) => {
    const schemaNames = [targetSchema]

    for (let i = 0; i < pathToFieldInArray.length; i++) {
        const schemaName = await getRelatedSchemaName(schemaNames[i], pathToFieldInArray[i])
        if (schemaName) schemaNames.push(schemaName)
    }

    return schemaNames
}

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

const getAllRelatedItems = async (targetSchema, triggerPathToFieldInArray, existingItem, updatedItem, gql) => {
    console.log('getAllRelatedItems', 1.1, targetSchema)
    console.log('getAllRelatedItems', 1.2, triggerPathToFieldInArray)
    console.log('getAllRelatedItems', 1.3, existingItem)
    const where = getRelatedItemsWhere(triggerPathToFieldInArray, existingItem)
    console.log('getAllRelatedItems', 1.4, 'need', { [triggerPathToFieldInArray[0][0]]: { id: existingItem.id } })
    console.log('getAllRelatedItems', 1.5, targetSchema, { where: JSON.stringify(where) })
    const items = await find(targetSchema, where)
    console.log('getAllRelatedItems', 2, items)

    return items
}

const getContext = async (schemaName) => {
    const { keystone } = await getSchemaCtx(schemaName)
    return await keystone.createContext({ skipAccessControl: true })
}

const checkRelatedDate = (relatedData) => {
    if (!relatedData || !isArray(relatedData)) throw new Error('"relatedData" field must be of type "array" and not empty!')

    for (const { targetSchema, schemaGql, triggerPathsToFields } of relatedData) {
        if (!targetSchema || !isString(targetSchema)) throw new Error('"targetSchema" field must be of type "string"!')

        if (!triggerPathsToFields || !isArray(triggerPathsToFields) || isEmpty(triggerPathsToFields)) throw new Error('"triggerPathsToFields" field must be of type "array" and not empty!')
        for (const triggerPathToField of triggerPathsToFields) {
            if (!triggerPathToField || !isString(triggerPathToField)) throw new Error('"triggerPathsToFields" field must be contained elements with type "string"!')
            if (triggerPathToField.split('.').length < 2) throw new Error('"triggerPathsToFields" field must be contained element with path to related field!')
        }

        if (!schemaGql) throw new Error('"schemaGql" field is required')
    }
}

const isUpdatedField = (existingItem, updatedItem, valueFieldName) => {
    return get(existingItem, valueFieldName) !== get(updatedItem, valueFieldName)
}

// { targetSchema, schema, triggerPathToField }
const searchUpdateByTrigger = (relatedData = []) => plugin((props) => {
    const { hooks = {}, ...rest } = props

    checkRelatedDate(relatedData)

    // 0.1 - получить путь к значению массивом
    relatedData = relatedData.map(item => ({
        ...item,
        triggerPathsToFieldsDetails: item.triggerPathsToFields.map(path => {
            const pathInArray = path.split('.')
            return {
                path,
                pathInArray,
                valueFieldName: pathInArray[pathInArray.length - 1],
            }
        }),
    }))

    const triggerHook = async (props) => {
        const { existingItem, updatedItem, operation } = props

        if (operation === 'update') {
            console.log('update after change', 1)
            for (const { targetSchema, schemaGql, triggerPathsToFieldsDetails } of relatedData) {

                const isUpdatedTriggerFields = triggerPathsToFieldsDetails.some(({ valueFieldName }) => isUpdatedField(existingItem, updatedItem, valueFieldName))

                if (isUpdatedTriggerFields) {
                    // for (const { path, pathInArray, valueFieldName } of triggerPathsToFields) {
                    //
                    //
                    //
                    // }

                    console.log('update after change', 2)
                    // // 1 - получить названия моделек в цепи
                    // const schemaNames = (await getAllSchemaNames(targetSchema, pathInArray)).reverse()
                    // console.log('update after change', 2.1, schemaNames)
                    // if (schemaNames.length < 2) return
                    // 2 - получать все связанные элементы
                    const relatedItems = await getAllRelatedItems(targetSchema, triggerPathsToFieldsDetails.map(item => item.pathInArray), existingItem, updatedItem)
                    console.log('update after change', 2.2, relatedItems)
                    // 3 - обновлять все элементы с поиском
                    for (const item of relatedItems) {
                        console.log('update after change', 3)
                        const id = get(item, 'id')
                        const searchVersion = get(item, 'searchVersion')
                        console.log('update after change', 3.2, { id, searchVersion })
                        if (id && searchVersion) {
                            console.log('update after change', 4.1)
                            console.log('update after change', 4.2, targetSchema, { id, searchVersion: searchVersion + 1 })
                            const context = await getContext(targetSchema)
                            console.log('update after change', 4.3, schemaGql)
                            const payload = {
                                dv: 1,
                                sender: { fingerprint: 'change-search-field', dv: 1 },
                                searchVersion: searchVersion + 1,
                            }
                            try {
                                // TODO change to execGqlWithoutAccess and custom gql
                                await schemaGql.update(context, id, payload)
                            } catch (e) {
                                console.log('ERROR!', e)
                            }
                            console.log('update after change', 5)
                        }
                    }

                }

            }
        }

        if (operation === 'delete') {
            // update search version in targetSchema
        }
    }

    const originalAfterChange = hooks.afterChange
    hooks.afterChange = composeNonResolveInputHook(originalAfterChange, triggerHook)
    const originalAfterDelete = hooks.afterDelete
    hooks.afterDelete = composeNonResolveInputHook(originalAfterDelete, triggerHook)

    return { hooks, ...rest }
})

module.exports = {
    searchUpdateByTrigger,
}
