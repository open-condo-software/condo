const memoize = require('micro-memoize')

const {
    validateFieldAccessControl,
    validateCustomAccessControl,
    validateAuthAccessControl,
} = require('@keystonejs/access-control')
const { mergeWhereClause } = require('@keystonejs/utils')

async function validateListAccessControl ({
    access,
    listKey,
    operation,
    authentication = {},
    originalInput,
    gqlName,
    itemId,
    itemIds,
    context,
    readFields,
}) {
    // Either a boolean or an object describing a where clause
    let result = false
    const acc = access[operation]
  
    if (typeof acc !== 'function') {
        result = acc
    } else {
        result = await acc({
            authentication: authentication.item ? authentication : {},
            listKey,
            operation,
            originalInput,
            gqlName,
            itemId,
            itemIds,
            context,
            readFields,
        })
    }
  
    if (!['object', 'boolean'].includes(typeof result)) {
        throw new Error(`Must return an Object or Boolean from Imperative or Declarative access control function. Got ${typeof result}`)
    } // Special case for 'create' permission
  
  
    if (operation === 'create' && typeof result === 'object') {
        throw new Error(`Expected a Boolean for ${listKey}.access.create(), but got Object. (NOTE: 'create' cannot have a Declarative access control config)`)
    }
  
    return result
}

function enhanceKeystone (keystone){
    const _getAccessControlContext = function ({ schemaName, authentication, skipAccessControl }) {
        if (skipAccessControl) {
            return {
                getCustomAccessControlForUser: () => true,
                getListAccessControlForUser: () => true,
                getFieldAccessControlForUser: () => true,
                getAuthAccessControlForUser: () => true,
            }
        }
        // memoizing to avoid requests that hit the same type multiple times.
        // We do it within the request callback so we can resolve it based on the
        // request info (like who's logged in right now, etc)
        const getCustomAccessControlForUser = memoize(
            async (item, args, context, info, access, gqlName) => {
                return validateCustomAccessControl({
                    item,
                    args,
                    context,
                    info,
                    access: access[schemaName],
                    authentication,
                    gqlName,
                })
            },
            { isPromise: true }
        )
    
        const getListAccessControlForUser = memoize(
            async (
                access,
                listKey,
                originalInput,
                operation,
                { gqlName, itemId, itemIds, context, readFields } = {}
            ) => {
                return validateListAccessControl({
                    access: access[schemaName],
                    originalInput,
                    operation,
                    authentication,
                    listKey,
                    gqlName,
                    itemId,
                    itemIds,
                    context,
                    readFields,
                })
            },
            { isPromise: true }
        )
    
        const getFieldAccessControlForUser = memoize(
            async (
                access,
                listKey,
                fieldKey,
                originalInput,
                existingItem,
                operation,
                { gqlName, itemId, itemIds, context } = {}
            ) => {
                return validateFieldAccessControl({
                    access: access[schemaName],
                    originalInput,
                    existingItem,
                    operation,
                    authentication,
                    fieldKey,
                    listKey,
                    gqlName,
                    itemId,
                    itemIds,
                    context,
                })
            },
            { isPromise: true }
        )
    
        const getAuthAccessControlForUser = memoize(
            async (access, listKey, { gqlName, context } = {}) => {
                return validateAuthAccessControl({
                    access: access[schemaName],
                    authentication,
                    listKey,
                    gqlName,
                    context,
                })
            },
            { isPromise: true }
        )
    
        return {
            getCustomAccessControlForUser,
            getListAccessControlForUser,
            getFieldAccessControlForUser,
            getAuthAccessControlForUser,
        }
    }

    keystone._getAccessControlContext = _getAccessControlContext.bind(keystone)

    Object.keys(keystone.lists).forEach(listKey => {
        const listQuery = async function (args, context, gqlName, info, from) {
            // const requestFields = 
            const access = await this.checkListAccess(context, undefined, 'read', { gqlName, readFields: info.fieldNodes[0].selectionSet.selections.map(s => s.name.value) })
            return this._itemsQuery(mergeWhereClause(args, access), { context, info, from })
        }
        keystone.lists[listKey].listQuery = listQuery.bind(keystone.lists[listKey])
    })
}

function getWrappedGQLResolvers (keystone) {
    const defaultResolvers = keystone.getResolvers({ schemaName: 'public' })
    return {
        ...defaultResolvers,
        Query: {
            ...defaultResolvers.Query,
            async allOrganizations (_, args, context, info) {
                const r = await defaultResolvers.Query.allOrganizations(_, args, context, info)
                return r
            },
        },
    }

}

module.exports = { enhanceKeystone, getWrappedGQLResolvers }