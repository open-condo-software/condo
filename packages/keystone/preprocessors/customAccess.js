const { getType } = require('@open-keystone/utils')
const find = require('lodash/find')
const get = require('lodash/get')

const { evaluateKeystoneAccessResult, evaluateKeystoneFieldAccessResult } = require('@open-condo/keystone/plugins/utils')
const { GQL_LIST_SCHEMA_TYPE } = require('@open-condo/keystone/schema')

function fieldAccessWrapperIfNeeded (access, fnWrapper) {
    // NOTE: you can use the same object in many places! you don't need to wrap it twice
    if (!fnWrapper.alreadyprocessedbycustomaccessplugin) fnWrapper.alreadyprocessedbycustomaccessplugin = true

    const type = getType(access)
    if (type === 'Boolean') {
        // No need to wrap! You already have access, or you should not have it anyway!
        return access
    } else if (type === 'Function') {
        // NOTE: to prevent multiple wrapping the same function
        if (access.alreadyprocessedbycustomaccessplugin) return access
        else return fnWrapper
    } else if (type === 'AsyncFunction') {
        // NOTE: to prevent multiple wrapping the same function
        if (access.alreadyprocessedbycustomaccessplugin) return access
        else return fnWrapper
    } else if (type === 'Object') {
        const newAccess = {}
        if (typeof access.read !== 'undefined') newAccess.read = fieldAccessWrapperIfNeeded(access.read, fnWrapper)
        if (typeof access.create !== 'undefined') newAccess.create = fieldAccessWrapperIfNeeded(access.create, fnWrapper)
        if (typeof access.update !== 'undefined') newAccess.update = fieldAccessWrapperIfNeeded(access.update, fnWrapper)
        if (typeof access.delete !== 'undefined') newAccess.delete = fieldAccessWrapperIfNeeded(access.delete, fnWrapper)
        if (typeof access.auth !== 'undefined') newAccess.auth = fieldAccessWrapperIfNeeded(access.auth, fnWrapper)
        return newAccess
    }

    throw new Error(
        `fieldAccessWrapperIfNeeded(), received ${type}.`,
    )
}

const customAccessPostProcessor = (schemaType, name, schema) => {
    if (schemaType !== GQL_LIST_SCHEMA_TYPE && !name.endsWith('HistoryRecord')) return schema

    const access = schema.access

    const customListAccess = (args) => {
        const { operation, authentication: { item: user }, listKey } = args
        const customAccess = get(find(get(user, 'customAccess.accessRules', []), { list: listKey }), operation)
        if (customAccess === true || customAccess === false) return customAccess
        return evaluateKeystoneAccessResult(access, operation, args)
    }

    schema.access = fieldAccessWrapperIfNeeded(access, customListAccess)

    Object.keys(schema.fields).forEach(field => {
        const fieldAccess = schema.fields[field].access

        if (fieldAccess) {
            const customFieldAccessWrapper = (args) => {
                const { operation, authentication: { item: user }, listKey } = args
                const schemaFieldsAccess = get(find(get(user, 'customAccess.accessRules', []),
                    { list: listKey } ), 'fields', []
                )
                const customAccess = get(find(schemaFieldsAccess, { field }), operation)

                if (customAccess === true || customAccess === false) return customAccess
                return evaluateKeystoneFieldAccessResult(fieldAccess, operation, args)
            }

            const fieldCustomAccessWrapper = fieldAccessWrapperIfNeeded(fieldAccess, customFieldAccessWrapper)
            schema.fields[field].access = fieldCustomAccessWrapper
        }
    })

    return schema
}

module.exports = {
    customAccessPostProcessor,
}
