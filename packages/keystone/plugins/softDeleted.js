const { getType } = require('@keystonejs/utils')
const { get } = require('lodash')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const { composeResolveInputHook, evaluateKeystoneAccessResult } = require('./utils')
const { plugin } = require('./utils/typing')

const { queryHasField } = require('../queryHasField')
const { find, getListDependentRelations, getSchemaCtx } = require('../schema')

const PROTECT = 'models.PROTECT'
const SET_NULL = 'models.SET_NULL'
const CASCADE = 'models.CASCADE'

const hasSoftDeletedField = (schemaName) => {
    const schemaCtx = getSchemaCtx(schemaName)
    return !!get(schemaCtx, ['list', 'fieldsByPath', 'deletedAt'], null)
}

const hasObjs = async (schemaName, path, objId) => {
    const where = { [path]: { id: objId } }

    // Sometimes dependent schemas may not have deletedAt field. For those fields we must not add deletedAt to Where clause
    if (hasSoftDeletedField(schemaName)) {
        // BillingReceipt { path: objId }
        where.deletedAt = null
    }

    // If there are any non deleted objects that have this ID
    return await find(schemaName, where)
}

/**
 * Before we delete an object, we must make sure we actually can do it (Check PROTECT rules)
 *
 * Here is a quick example to get you the concept:
 *
 * Example 1:
 *
 * Book -> Author
 * - typeof book.author == relation
 * - on_delete = PROTECT (Before we drop Author => check if there are ANY Books, that are connected to this author)
 *
 * Setup:
 * 1. Create Author id=1
 * 2. Create Book id=1
 * 3. Set book.author = 1
 *
 * Action:
 * - Try to delete Author (id=1)
 *
 * Assert:
 * Error
 *
 * Comment:
 * To delete author we must check if there are ANY objects in schema Books that:
 * 1. Are not deleted
 * 2. Have book.author equal to deleted author (id=1)
 * 3. Since these books exist ([Book<id=1>]) we raise an error
 *
 * --
 *
 * We also need to make sure that CASCADE option is respected. So check the following example:
 *
 * Example 2:
 *
 * User -> Author
 * - typeof author.user == relation
 * - on_delete = CASCADE (if User is dropped, then related Author is dropped)
 * Book -> Author
 * - typeof book.author == relation
 * - on_delete = PROTECT (Before we drop Author => check if there are ANY Books, that are connected to this author)
 *
 * Setup:
 * 1. Create User id=1
 * 2. Create Author id=1
 * 3. Set author.user = 1
 * 4. Create Book id=1
 * 5. Set book.author = 1
 *
 * Action:
 * - Try to delete User (id=1)
 *
 * Assert:
 * Error
 *
 * Comment:
 * Since User -> Author is CASCADE relation, we must check if there are ANY objects in schema Books that:
 * 1. Are not deleted
 * 2. Have book.author equal to Author, that relates to deleted User
 * 3. Since these books exist ([Book<id=1>]) we raise an error
 */
const canDelete = async (listName, obj, context) => {
    const relations = getListDependentRelations(listName)

    const objId = typeof obj === 'string' ? obj : obj.id

    for (const rel of relations) {
        const onDelete = get(rel, ['config', 'kmigratorOptions', 'on_delete'])

        if (onDelete === PROTECT) {
            const existingDependants = await hasObjs(rel.from, rel.path, objId)
            if (existingDependants.length > 0) {
                throw new GQLError({
                    ...ERRORS.CANNOT_DELETE_PROTECTED_RELATION,
                    messageInterpolation: { relTo: rel.to, relFrom: rel.from, existingDependants: existingDependants.map(x => x.id).join(','), objId: obj.id },
                }, context)
            }
        }
        if (onDelete === CASCADE) {
            const existingDependants = await hasObjs(rel.from, rel.path, objId)
            for (const dep of existingDependants) {
                await canDelete(rel.from, dep.id)
            }
        }
        // if SET_NULL, we don't need to do anything here
    }

    return true
}

const ALREADY_MERGED = 'ALREADY_MERGED'
const ALREADY_DELETED = 'ALREADY_DELETED'
const CANNOT_DELETE_PROTECTED_RELATION = 'CANNOT_DELETE_PROTECTED_RELATION'

const ERRORS = {
    ALREADY_MERGED: {
        code: BAD_USER_INPUT,
        type: ALREADY_MERGED,
        message: 'Already merged',
        messageForUser: `api.softDeleted.${ALREADY_MERGED}`,
    },
    ALREADY_DELETED: {
        code: BAD_USER_INPUT,
        type: ALREADY_DELETED,
        message: 'Already deleted',
        messageForUser: `api.softDeleted.${ALREADY_DELETED}`,
    },
    CANNOT_DELETE_PROTECTED_RELATION: {
        code: BAD_USER_INPUT,
        type: CANNOT_DELETE_PROTECTED_RELATION,
        message: 'You cannot delete this entity. It has a dependant relation, with relation.onDelete set to PROTECT',
        messageForUser: `api.softDeleted.${CANNOT_DELETE_PROTECTED_RELATION}`,
    },
}

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
    const newResolveInput = async ({ context, existingItem, resolvedData }) => {
        if (existingItem && existingItem[newIdField]) {
            throw new GQLError(ERRORS.ALREADY_MERGED, context)
        }
        if (existingItem && existingItem[deletedAtField] && resolvedData[deletedAtField] !== null) {
            throw new GQLError(ERRORS.ALREADY_DELETED, context)
        }
        if (resolvedData[deletedAtField]) {
            await canDelete(schemaName, { ...existingItem, ...resolvedData }, context)
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
 * We don't want developer to manually set the filter on every query like this:
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
    SOFT_DELETED_ERRORS: ERRORS,
}
