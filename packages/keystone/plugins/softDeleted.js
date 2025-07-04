const { getType } = require('@open-keystone/utils')
const { get } = require('lodash')

const { composeResolveInputHook, evaluateKeystoneAccessResult } = require('./utils')
const { plugin } = require('./utils/typing')

const { queryHasField } = require('../queryHasField')

const softDeleted = ({ deletedAtField = 'deletedAt', newIdField = 'newId' } = {}) => plugin(({ fields = {}, hooks = {}, access, ...rest }, { schemaName }) => {
    // TODO(pahaz):
    //  [x] 1) filter by default deletedAt = null (access.read), how-to change it?!
    //  [x] 2) allow update only for deletedAt = null (access.update)
    //  [x] 3) disallow access to hard delete (access.delete)
    //  [ ] 4) what if some object has FK (Relation) to SoftDeletedList ?
    // TODO(pahaz): WIP
    //  [x] 1) filter by default newId = null (access.read) --> newId is set deketedAt by default
    //  [x] 2) allow update only for newId = null (access.update) --> newId is set deketedAt by default
    //  [ ] 3) what if some object has FK (Relation) to mergeable() list ?
    //  [ ] 4) check is newId object have newId (merge merged list)
    //  [ ] 5) check access to newId

    const datedOptions = {
        type: 'DateTimeUtc',
        access: {
            read: true,
            create: false,
            update: true,
        },
        kmigratorOptions: { null: true, db_index: true },
    }
    const newIdOptions = {
        type: 'HiddenRelationship',
        ref: schemaName,
        access: {
            read: true,
            create: false,
            update: true,
        },
        kmigratorOptions: { null: true },
    }

    fields[deletedAtField] = { ...datedOptions }
    fields[newIdField] = { ...newIdOptions }

    // NOTE: we can't change and restore already merged objects!
    const newResolveInput = ({ existingItem, resolvedData }) => {
        if (existingItem && existingItem[newIdField]) {
            throw new Error('Already merged')
        }
        if (existingItem && existingItem[deletedAtField] && resolvedData[deletedAtField] !== null) {
            throw new Error('Already deleted')
        }
        if (resolvedData[deletedAtField]) {
            resolvedData[deletedAtField] = new Date().toISOString()
        }
        if (resolvedData[newIdField]) {
            // TODO(pahaz): check newIdField ID!
            if (!resolvedData[deletedAtField]) {
                // NOTE: merged == deleted
                resolvedData[deletedAtField] = new Date().toISOString()
            }
        }
        return resolvedData
    }

    const originalResolveInput = hooks.resolveInput
    hooks.resolveInput = composeResolveInputHook(originalResolveInput, newResolveInput)

    const softDeletePluginWrapperForAccess = async (args) => {
        const { operation } = args
        if (operation === 'read') {
            const current = await evaluateKeystoneAccessResult(access, 'read', args)
            return applySoftDeletedFilters(current, deletedAtField, args)
        } else if (operation === 'delete') {
            return false
        } else {
            return await evaluateKeystoneAccessResult(access, operation, args)
        }
    }

    return { fields, hooks, access: softDeletePluginWrapperForAccess, ...rest }
})

/**
 * Gets "where" variables from http graphQL request
 * NOTE: it's a hack! Because we don't have access to GraphQL variables inside Keystone access function!
 * @param {Object} args
 * @return {Object}
 */
function getWhereVariables (args) {
    const method = get(args, ['context', 'req', 'method'])
    let variables = {}
    if (method === 'GET') {
        variables = get(args, ['context', 'req', 'query', 'variables'])
    }
    else if (method === 'POST') {
        variables = get(args, ['context', 'req', 'body', 'variables'])
    }
    try {
        // Local test client parses variables into string type
        if (typeof variables === 'string') {
            return JSON.parse(variables).where || {}
        }
        // GraphiQL parses variables into object
        else if (typeof variables === 'object') {
            return variables.where
        }
    } catch (e) {
        return {}
    }
}

/**
 * SYNOPSIS:
 * We dont want developer to manually set the filter on every query like this:
 * getAllEntities where : {deletedAt: null}
 * Instead we want to automatically hide deleted items.
 * Right now (keystone v5) we can only implement this functionality by merging
 * access rights from entity and deletedAt: null
 *
 * OVERRIDE THIS BEHAVIOUR:
 * We also want to give developer an ability to manually override the settings
 * and explicitly show the deleted items. For this developer should explicitly
 * set deletedAt at the request filter:
 * getAllEntities where : {deletedAt_not: null} // will get all deleted entities
 *
 * NOTE:
 * If you want to override default behaviour by explicitly setting
 * {deletedAt_not: null} on any part of the query -> the filters will not be
 * activated. So if you want to override the default behaviour on one part of the
 * query, you should explicitly specify the {deletedAt: null} on ALL other parts of
 * the query to get only NOT DELETED items
 *
 * Example:
 * wrong: where = { role : { deletedAt: null } }
 * correct: where = { role : { deletedAt: null }, deletedAt: null }
 *
 * For more info look up to the https://github.com/open-condo-software/condo/pull/232/files#r664256921
 */
function applySoftDeletedFilters (access, deletedAtField, args) {
    const currentWhereFilters = getWhereVariables(args)
    // If the filtering parameter is called not "where" or we want to skip this logic
    const queryDeleted = get(args, ['context', 'req', 'query', 'deleted'])

    // If we explicitly pass the deletedAt filter - we wont hide deleted items
    if (queryDeleted || queryHasField(currentWhereFilters, deletedAtField)) {
        return access
    }

    const type = getType(access)
    if (type === 'Boolean') {
        return (access) ? { [deletedAtField]: null } : false
    } else if (type === 'Object') {
        const anyFilterByDeleted = Object.keys(access).find((x) => x.startsWith(deletedAtField))
        if (anyFilterByDeleted) return access
        return {
            ...access,
            [deletedAtField]: null,
        }
    }

    throw new Error(
        `applySoftDeletedFilters() accept a boolean or a object, received ${type}.`,
    )
}

module.exports = {
    softDeleted,
}
