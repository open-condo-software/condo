const { DateTimeUtc } = require('@keystonejs/fields')
const { getType } = require('@keystonejs/utils')

const { HiddenRelationship } = require('./utils')
const { composeHook, evaluateKeystoneAccessResult } = require('./utils')

const softDeleted = ({ deletedAtField = 'deletedAt', newIdField = 'newId' } = {}) => ({ fields = {}, hooks = {}, access, ...rest }, { listKey, keystone }) => {
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
        type: DateTimeUtc,
        access: {
            read: true,
            create: false,
            update: true,
        },
        kmigratorOptions: { null: true, db_index: true },
    }
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

    fields[deletedAtField] = { ...datedOptions }
    fields[newIdField] = { ...newIdOptions }

    const newResolveInput = ({ resolvedData, existingItem }) => {
        if (existingItem && existingItem[deletedAtField]) {
            throw new Error('Already deleted')
        }
        if (existingItem && existingItem[newIdField]) {
            throw new Error('Already merged')
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
    hooks.resolveInput = composeHook(originalResolveInput, newResolveInput)

    const newAccess = async (args) => {
        const { operation } = args
        if (operation === 'read') {
            const current = await evaluateKeystoneAccessResult(access, 'read', args, keystone)
            return applySoftDeletedFilters(current, deletedAtField)
        } else if (operation === 'delete') {
            return false
        } else {
            return await evaluateKeystoneAccessResult(access, operation, args, keystone)
        }
    }

    return { fields, hooks, access: newAccess, ...rest }
}

function applySoftDeletedFilters (access, deletedAtField) {
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
