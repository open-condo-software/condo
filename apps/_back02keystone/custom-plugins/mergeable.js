const { HiddenRelationship } = require('./historical/field')
const { composeHook } = require('./_common')
const { getType } = require('@keystonejs/utils')

const mergeable = ({ newIdField = 'newId' } = {}) => ({ fields = {}, hooks = {}, access, ...rest }, { listKey, keystone }) => {
    // TODO(pahaz): WIP
    //  [ ] 1) filter by default newId = null (access.read)
    //  [ ] 2) allow update only for newId = null (access.update)
    //  [ ] 3) what if some object has FK (Relation) to mergeable() list ?
    //  [ ] 4) check is newId exists and dont't have newId (merge merged list)
    //  [ ] 5) check access to newId

    const newIdOptions = {
        type: HiddenRelationship,
        ref: listKey,
        access: {
            read: true,
            create: false,
            update: true,
        },
        kmigratorOptions: { null: true },
    }

    fields[newIdField] = { ...newIdOptions }

    const newResolveInput = ({ resolvedData, existingItem }) => {
        if (resolvedData[newIdField]) {
            // TODO(pahaz): check!
        }
        if (existingItem && existingItem[newIdField]) {
            throw new Error('Already merged')
        }
        return resolvedData
    }

    const originalResolveInput = hooks.resolveInput
    hooks.resolveInput = composeHook(originalResolveInput, newResolveInput)

    const newAccess = (args) => {
        const { operation } = args
        if (operation === 'read') {
            const current = getOpAccess('read', keystone, access, args)
            return applyMergedFilters(current, newIdField)
        } else {
            return getOpAccess(operation, keystone, access, args)
        }
    }

    return { fields, hooks, access: newAccess, ...rest }
}

function getOpAccess (op, keystone, access, args) {
    const type = getType(access)
    switch (type) {
        case 'Boolean':
            return access || false
        case 'Function':
            return access(args) || false
        case 'Object':
            const opAccess = access[op]
            if (opAccess) return getOpAccess(op, keystone, opAccess, args)
            return keystone.defaultAccess.list || false
        case 'Undefined':
            return keystone.defaultAccess.list || false
        default:
            throw new Error(
                `getOpAccess(), received ${type}.`,
            )
    }
}

function applyMergedFilters (access, newIdField) {
    const type = getType(access)
    switch (type) {
        case 'Boolean':
            return (access) ? { [newIdField]: null } : false
        case 'Object':
            const anyFilterByMerged = Object.keys(access).find((x) => x.startsWith(newIdField))
            if (anyFilterByMerged) return access
            return {
                ...access,
                [newIdField]: null,
            }
        default:
            throw new Error(
                `applyMergedFilters() accept a boolean or a object, received ${type}.`,
            )
    }
}

module.exports = {
    mergeable,
}
